export interface ReportVerifiedPayload {
  report_id: string;
  genuine_votes?: number;
  threshold?: number;
  ledger?: number;
  pagingToken?: string;
}

export interface ReportRecord {
  id: string;
  title?: string;
  reporter_wallet: string | null;
  verified?: boolean;
  reward_tx_hash?: string | null;
}

export interface RewardTransactionRecord {
  id?: string;
  report_id: string;
  wallet: string;
  amount_xlm: string;
  tx_hash: string;
  created_at?: Date;
}

export interface RewardDatabaseAdapter {
  findReportById(reportId: string): Promise<ReportRecord | null>;
  saveReportRewardTxHash(reportId: string, txHash: string): Promise<void>;
  insertRewardTransaction(record: RewardTransactionRecord): Promise<RewardTransactionRecord>;
}

export interface SorobanRewardContractClient {
  payReward(params: {
    reportId: string;
    recipientWallet: string;
    amountXlm: string;
  }): Promise<{ txHash: string }>;
}

export interface RealtimeEventEmitter {
  emit(event: string, payload: Record<string, unknown>): void;
}

export interface HorizonEventStreamSubscription {
  close: () => void;
}

export type HorizonStreamFactory = (handlers: {
  cursor: string;
  onEvent: (event: ReportVerifiedPayload) => Promise<void> | void;
  onError: (err: unknown) => void;
}) => HorizonEventStreamSubscription;

export interface StellarListenerConfig {
  horizonUrl?: string;
  sorobanRpcUrl?: string;
  votingContractId?: string;
  rewardContractId?: string;
  defaultRewardXlm?: string;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  cursor?: string;
}

/**
 * Listens to Stellar Horizon / Soroban event streams for `ReportVerified` contract events,
 * triggers `pay_reward` on the Soroban reward contract, records the payout in
 * `reward_transactions`, updates the report's `tx_hash`, and emits `report_verified`
 * over WebSocket. Automatically reconnects with exponential backoff on stream disconnects.
 */
export class StellarListenerService {
  private subscription: HorizonEventStreamSubscription | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryAttempt = 0;
  private lastCursor: string;
  private isShuttingDown = false;
  private readonly processedReports = new Set<string>();

  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly defaultRewardXlm: string;

  constructor(
    private readonly db: RewardDatabaseAdapter,
    private readonly sorobanClient: SorobanRewardContractClient,
    private readonly wsEmitter: RealtimeEventEmitter,
    private readonly streamFactory: HorizonStreamFactory,
    private readonly config: StellarListenerConfig = {},
  ) {
    this.initialBackoffMs = config.initialBackoffMs ?? 1000;
    this.maxBackoffMs = config.maxBackoffMs ?? 30000;
    this.defaultRewardXlm = config.defaultRewardXlm ?? '10.0000000';
    this.lastCursor = config.cursor ?? 'now';
  }

  /**
   * NestJS lifecycle hook: automatically starts the Horizon event listener on app bootstrap.
   */
  async onModuleInit(): Promise<void> {
    this.isShuttingDown = false;
    this.startStream();
  }

  /**
   * NestJS lifecycle hook: cleanly closes the stream and cancels pending reconnect timers.
   */
  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.subscription) {
      this.subscription.close();
      this.subscription = null;
    }
  }

  /**
   * Computes exponential backoff delay (in milliseconds) for a given retry attempt.
   */
  public computeBackoffDelay(attempt: number): number {
    const exponential = this.initialBackoffMs * Math.pow(2, Math.max(0, attempt));
    return Math.min(exponential, this.maxBackoffMs);
  }

  /**
   * Starts or restarts the Stellar Horizon / Soroban event stream subscription.
   */
  public startStream(): void {
    if (this.isShuttingDown) {
      return;
    }

    if (this.subscription) {
      this.subscription.close();
      this.subscription = null;
    }

    this.subscription = this.streamFactory({
      cursor: this.lastCursor,
      onEvent: async (event: ReportVerifiedPayload) => {
        this.retryAttempt = 0;
        if (event.pagingToken) {
          this.lastCursor = event.pagingToken;
        }
        await this.handleReportVerifiedEvent(event);
      },
      onError: (_err: unknown) => {
        this.scheduleReconnect();
      },
    });
  }

  /**
   * Handles a `ReportVerified` contract event:
   * 1. Looks up report in DB by `report_id`
   * 2. Retrieves reporter's linked Stellar wallet address
   * 3. Calls reward contract's `pay_reward` via Soroban RPC
   * 4. Saves `tx_hash` to report record and logs to `reward_transactions`
   * 5. Emits `report_verified` WebSocket event
   */
  public async handleReportVerifiedEvent(
    event: ReportVerifiedPayload,
  ): Promise<RewardTransactionRecord | null> {
    const reportId = event.report_id?.trim();
    if (!reportId || this.processedReports.has(reportId)) {
      return null;
    }

    const report = await this.db.findReportById(reportId);
    if (!report || !report.reporter_wallet) {
      return null;
    }

    if (report.reward_tx_hash) {
      this.processedReports.add(reportId);
      return null;
    }

    const { txHash } = await this.sorobanClient.payReward({
      reportId: report.id,
      recipientWallet: report.reporter_wallet,
      amountXlm: this.defaultRewardXlm,
    });

    await this.db.saveReportRewardTxHash(report.id, txHash);

    const rewardRecord = await this.db.insertRewardTransaction({
      report_id: report.id,
      wallet: report.reporter_wallet,
      amount_xlm: this.defaultRewardXlm,
      tx_hash: txHash,
    });

    this.processedReports.add(reportId);

    this.wsEmitter.emit('report_verified', {
      reportId: report.id,
      wallet: report.reporter_wallet,
      amountXlm: this.defaultRewardXlm,
      txHash,
      verifiedAt: new Date().toISOString(),
    });

    return rewardRecord;
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown || this.reconnectTimer) {
      return;
    }

    const delayMs = this.computeBackoffDelay(this.retryAttempt);
    this.retryAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.startStream();
    }, delayMs);
  }
}
