import {
  HorizonStreamFactory,
  RealtimeEventEmitter,
  ReportRecord,
  RewardDatabaseAdapter,
  RewardTransactionRecord,
  SorobanRewardContractClient,
  StellarListenerService,
} from './stellar-listener.service';

describe('StellarListenerService', () => {
  let reportsStore: Map<string, ReportRecord>;
  let rewardTransactions: RewardTransactionRecord[];
  let emittedEvents: Array<{ event: string; payload: Record<string, unknown> }>;
  let payRewardCalls: Array<{ reportId: string; recipientWallet: string; amountXlm: string }>;
  let db: RewardDatabaseAdapter;
  let sorobanClient: SorobanRewardContractClient;
  let wsEmitter: RealtimeEventEmitter;

  beforeEach(() => {
    reportsStore = new Map<string, ReportRecord>([
      [
        '550e8400-e29b-41d4-a716-446655440000',
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Armed Robbery — Victoria Island',
          reporter_wallet: 'GBXP47291STELLARREPORTERWALLETADDRESS000000000000000K4F2',
          verified: false,
          reward_tx_hash: null,
        },
      ],
    ]);
    rewardTransactions = [];
    emittedEvents = [];
    payRewardCalls = [];

    db = {
      async findReportById(reportId: string) {
        return reportsStore.get(reportId) ?? null;
      },
      async saveReportRewardTxHash(reportId: string, txHash: string) {
        const existing = reportsStore.get(reportId);
        if (existing) {
          existing.verified = true;
          existing.reward_tx_hash = txHash;
        }
      },
      async insertRewardTransaction(record: RewardTransactionRecord) {
        const saved = { ...record, id: 'tx-uuid-1', created_at: new Date() };
        rewardTransactions.push(saved);
        return saved;
      },
    };

    sorobanClient = {
      async payReward(params) {
        payRewardCalls.push(params);
        return {
          txHash: 'a9f4e2c18b7d6054321fedcba9876543210fedcba9876543210fedcba9876543',
        };
      },
    };

    wsEmitter = {
      emit(event: string, payload: Record<string, unknown>) {
        emittedEvents.push({ event, payload });
      },
    };
  });

  it('starts listening on module init, pays reward on ReportVerified, saves tx_hash, logs to reward_transactions, and emits report_verified', async () => {
    let capturedHandlers: Parameters<HorizonStreamFactory>[0] | null = null;

    const streamFactory: HorizonStreamFactory = (handlers) => {
      capturedHandlers = handlers;
      return { close: () => {} };
    };

    const service = new StellarListenerService(
      db,
      sorobanClient,
      wsEmitter,
      streamFactory,
      { defaultRewardXlm: '15.0000000' },
    );

    await service.onModuleInit();
    expect(capturedHandlers).not.toBeNull();

    await capturedHandlers!.onEvent({
      report_id: '550e8400-e29b-41d4-a716-446655440000',
      genuine_votes: 5,
      threshold: 5,
      pagingToken: 'cursor-101',
    });

    expect(payRewardCalls).toHaveLength(1);
    expect(payRewardCalls[0]).toEqual({
      reportId: '550e8400-e29b-41d4-a716-446655440000',
      recipientWallet: 'GBXP47291STELLARREPORTERWALLETADDRESS000000000000000K4F2',
      amountXlm: '15.0000000',
    });

    const updatedReport = reportsStore.get('550e8400-e29b-41d4-a716-446655440000');
    expect(updatedReport?.reward_tx_hash).toBe(
      'a9f4e2c18b7d6054321fedcba9876543210fedcba9876543210fedcba9876543',
    );

    expect(rewardTransactions).toHaveLength(1);
    expect(rewardTransactions[0].wallet).toBe(
      'GBXP47291STELLARREPORTERWALLETADDRESS000000000000000K4F2',
    );
    expect(rewardTransactions[0].amount_xlm).toBe('15.0000000');

    expect(emittedEvents).toHaveLength(1);
    expect(emittedEvents[0].event).toBe('report_verified');
    expect(emittedEvents[0].payload.reportId).toBe('550e8400-e29b-41d4-a716-446655440000');

    await service.onModuleDestroy();
  });

  it('reconnects automatically with exponential backoff on stream disconnect', async () => {
    let subscribeCount = 0;
    let lastErrorHandler: ((err: unknown) => void) | null = null;

    const streamFactory: HorizonStreamFactory = (handlers) => {
      subscribeCount += 1;
      lastErrorHandler = handlers.onError;
      return { close: () => {} };
    };

    const service = new StellarListenerService(
      db,
      sorobanClient,
      wsEmitter,
      streamFactory,
      { initialBackoffMs: 10, maxBackoffMs: 80 },
    );

    expect(service.computeBackoffDelay(0)).toBe(10);
    expect(service.computeBackoffDelay(1)).toBe(20);
    expect(service.computeBackoffDelay(2)).toBe(40);
    expect(service.computeBackoffDelay(5)).toBe(80);

    await service.onModuleInit();
    expect(subscribeCount).toBe(1);

    lastErrorHandler!(new Error('Horizon SSE stream disconnected'));
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(subscribeCount).toBe(2);

    await service.onModuleDestroy();
  });
});
