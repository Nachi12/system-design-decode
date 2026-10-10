export interface CapacityModelDefinition {
  id: string;
  title: string;
  domain: 'netflix' | 'bookmyshow';
  objective: string;
  systemBoundary: string;
  inputs: {
    name: string;
    key: string;
    defaultValue: number;
    unit: string;
    min: number;
    max: number;
    step: number;
    description: string;
  }[];
  formulas: {
    name: string;
    equation: string;
    explanation: string;
  }[];
  calculate: (inputs: Record<string, number>) => {
    metrics: { label: string; value: string; unit: string; highlight?: boolean; note?: string }[];
    takeaways: string[];
  };
}

export const CAPACITY_MODELS: CapacityModelDefinition[] = [
  // Model 1: Netflix 2D Homepage Assembly
  {
    id: 'netflix-homepage',
    title: 'Model 1: Netflix 2D Homepage Assembly & Feature Cache Sizing',
    domain: 'netflix',
    objective: 'Estimate online API gateway QPS, peak ingress bandwidth, and in-memory EVCache cluster memory requirements for real-time 2D grid generation under a strict 100ms deadline.',
    systemBoundary: 'API Gateway (Zuul 2), Page Assembly Engine, and EVCache clusters (Memcached/Redis). Excludes video byte delivery.',
    inputs: [
      {
        name: 'Daily Active Members (DAU)',
        key: 'dau',
        defaultValue: 100000000,
        unit: 'users',
        min: 10000000,
        max: 300000000,
        step: 10000000,
        description: 'Total active subscriber profiles opening the application in a 24-hour window.'
      },
      {
        name: 'Homepage Sessions per Member per Day',
        key: 'sessionsPerUser',
        defaultValue: 5,
        unit: 'sessions/day',
        min: 1,
        max: 15,
        step: 1,
        description: 'Average number of times a user opens the app or switches profiles daily.'
      },
      {
        name: 'Peak-to-Average Traffic Multiplier',
        key: 'peakMultiplier',
        defaultValue: 2.5,
        unit: 'ratio',
        min: 1.5,
        max: 4.0,
        step: 0.1,
        description: 'Peak evening traffic spike multiplier relative to daily average request rate.'
      },
      {
        name: '2D Layout Tree Payload Size',
        key: 'payloadKb',
        defaultValue: 120,
        unit: 'KB',
        min: 50,
        max: 300,
        step: 10,
        description: 'Serialized JSON layout tree sent to TV/mobile client (rows, title IDs, artwork URLs).'
      },
      {
        name: 'Profile Vector & History Context Size',
        key: 'vectorKb',
        defaultValue: 2.5,
        unit: 'KB',
        min: 1.0,
        max: 10.0,
        step: 0.5,
        description: 'Cached nearline member representation stored in EVCache per active profile.'
      }
    ],
    formulas: [
      {
        name: 'Daily Homepage Requests',
        equation: 'R_daily = DAU * Sessions_per_user',
        explanation: 'Total number of full-page assembly requests serviced by online gateways per day.'
      },
      {
        name: 'Average Request Rate (QPS)',
        equation: 'QPS_avg = R_daily / 86,400 seconds',
        explanation: 'Mean steady-state throughput required across all AWS regions.'
      },
      {
        name: 'Peak Ingress QPS',
        equation: 'QPS_peak = QPS_avg * Peak_Multiplier',
        explanation: 'Maximum request rate experienced during prime-time evening hours.'
      },
      {
        name: 'Peak Egress Bandwidth',
        equation: 'BW_peak = QPS_peak * Payload_Size * 8 bits',
        explanation: 'Outbound API gateway bandwidth required to transmit JSON layouts to clients.'
      },
      {
        name: 'EVCache Cluster Memory Footprint',
        equation: 'RAM_evcache = DAU * Vector_Size * Replication_Factor (3x)',
        explanation: 'Total RAM needed to retain active profile session vectors with 3-way replication.'
      }
    ],
    calculate: (inputs) => {
      const dau = inputs.dau;
      const sessions = inputs.sessionsPerUser;
      const peakMul = inputs.peakMultiplier;
      const payloadKb = inputs.payloadKb;
      const vectorKb = inputs.vectorKb;

      const dailyRequests = dau * sessions;
      const qpsAvg = dailyRequests / 86400;
      const qpsPeak = qpsAvg * peakMul;
      const peakBwGbps = (qpsPeak * payloadKb * 8) / 1000000;
      const cacheRamGb = (dau * vectorKb * 3) / (1024 * 1024);

      return {
        metrics: [
          { label: 'Total Daily Homepage Requests', value: (dailyRequests / 1e6).toFixed(1) + 'M', unit: 'requests/day' },
          { label: 'Average Steady-State QPS', value: Math.round(qpsAvg).toLocaleString(), unit: 'QPS' },
          { label: 'Peak Ingress Request Rate', value: Math.round(qpsPeak).toLocaleString(), unit: 'QPS', highlight: true },
          { label: 'Peak API Gateway JSON Egress', value: peakBwGbps.toFixed(2), unit: 'Gbps' },
          { label: 'EVCache Cluster RAM (3x Replicated)', value: Math.round(cacheRamGb).toLocaleString(), unit: 'GB RAM', highlight: true }
        ],
        takeaways: [
          `At ${Math.round(qpsPeak).toLocaleString()} peak QPS, Zuul 2 gateway clusters utilize non-blocking Netty event loops to maintain connection persistence without thread starvation.`,
          `The active profile context footprint (${Math.round(cacheRamGb)} GB) easily fits across a multi-node Memcached/EVCache cluster in AWS.`,
          'Strict 100ms request SLA mandates circuit-breaker fallbacks if online scoring exceeds 40ms.'
        ]
      };
    }
  },

  // Model 2: Netflix Open Connect CDN Global Bandwidth
  {
    id: 'netflix-cdn',
    title: 'Model 2: Netflix Open Connect CDN Global Bandwidth & OCA Sizing',
    domain: 'netflix',
    objective: 'Calculate planetary peak streaming bandwidth offload, flash appliance hardware counts, and ISP edge localization ratios.',
    systemBoundary: 'Open Connect Appliances (OCAs) deployed in partner ISP networks and IXP peering rooms worldwide.',
    inputs: [
      {
        name: 'Concurrent Active Video Streams',
        key: 'concurrentStreams',
        defaultValue: 25000000,
        unit: 'streams',
        min: 5000000,
        max: 50000000,
        step: 2500000,
        description: 'Simultaneous playback sessions during global peak streaming hours.'
      },
      {
        name: 'Weighted Average Video Bitrate',
        key: 'avgBitrateMbps',
        defaultValue: 4.5,
        unit: 'Mbps',
        min: 2.0,
        max: 15.0,
        step: 0.5,
        description: 'Blended average stream bitrate across SD, HD (1080p), and 4K UHD titles.'
      },
      {
        name: 'Throughput per Flash OCA Server',
        key: 'ocaLineRateGbps',
        defaultValue: 100,
        unit: 'Gbps',
        min: 40,
        max: 200,
        step: 10,
        description: 'Sustained TLS video streaming throughput of a single 1RU FreeBSD flash appliance.'
      },
      {
        name: 'Edge Cache Hit Ratio',
        key: 'edgeHitRatio',
        defaultValue: 0.95,
        unit: 'ratio',
        min: 0.80,
        max: 0.99,
        step: 0.01,
        description: 'Fraction of video bytes served directly from local ISP embedded appliances.'
      }
    ],
    formulas: [
      {
        name: 'Aggregate Peak Video Bandwidth',
        equation: 'BW_total = Concurrent_Streams * Avg_Bitrate',
        explanation: 'Total global bandwidth delivery demand during worldwide prime time.'
      },
      {
        name: 'Bandwidth Localized to ISP Edges',
        equation: 'BW_edge = BW_total * Edge_Hit_Ratio',
        explanation: 'Bytes served directly inside customer ISP rooms, avoiding public peering transit.'
      },
      {
        name: 'Transit Peering Spillover',
        equation: 'BW_transit = BW_total * (1 - Edge_Hit_Ratio)',
        explanation: 'Bytes fetched from regional Internet Exchange Points (IXPs) on cache miss.'
      },
      {
        name: 'Minimum Flash OCAs Required',
        equation: 'OCAs_min = BW_total / OCA_Line_Rate',
        explanation: 'Total physical 100 Gbps flash appliances required globally at full utilization.'
      }
    ],
    calculate: (inputs) => {
      const streams = inputs.concurrentStreams;
      const bitrate = inputs.avgBitrateMbps;
      const lineRate = inputs.ocaLineRateGbps;
      const hitRatio = inputs.edgeHitRatio;

      const totalBwTbps = (streams * bitrate) / 1000000;
      const edgeBwTbps = totalBwTbps * hitRatio;
      const transitBwTbps = totalBwTbps * (1 - hitRatio);
      const minOcas = Math.ceil((totalBwTbps * 1000) / lineRate);

      return {
        metrics: [
          { label: 'Aggregate Peak Delivery Bandwidth', value: totalBwTbps.toFixed(1), unit: 'Tbps', highlight: true },
          { label: 'Traffic Localized to ISP Server Rooms', value: edgeBwTbps.toFixed(1), unit: 'Tbps' },
          { label: 'Transit Peering Spillover (IXPs)', value: transitBwTbps.toFixed(1), unit: 'Tbps' },
          { label: 'Minimum 100 Gbps Flash OCAs (N+1 Fleet)', value: (minOcas * 1.2).toFixed(0), unit: 'Appliances', highlight: true, note: 'Includes 20% redundancy buffer' }
        ],
        takeaways: [
          `Streaming ${totalBwTbps.toFixed(1)} Tbps without Open Connect would cost tens of millions of dollars monthly in commercial cloud transit egress.`,
          `Achieving 100 Gbps per appliance requires FreeBSD zero-copy sendfile and kTLS to bypass user-space memory copies.`,
          'Proactive off-peak fill overnight pre-positions content, ensuring 95%+ cache hit rates during evening surges.'
        ]
      };
    }
  },

  // Model 3: BookMyShow Steady-State vs Flash Sale Surge
  {
    id: 'bookmyshow-surge',
    title: 'Model 3: BookMyShow Flash Sale Contention & Admission Control',
    domain: 'bookmyshow',
    objective: 'Model extreme write contention, Amdahl\'s law serialization bottlenecks, and edge virtual waiting room admission limits during high-demand concert releases.',
    systemBoundary: 'Edge Virtual Waiting Room, Ingress Gateway, In-Memory Ephemeral Lock (Redis Lua), and Aurora PostgreSQL Writer.',
    inputs: [
      {
        name: 'Queued Concurrent Users at t = 0',
        key: 'queuedUsers',
        defaultValue: 2000000,
        unit: 'users',
        min: 100000,
        max: 5000000,
        step: 100000,
        description: 'Total prospective buyers waiting at the announced ticket release second.'
      },
      {
        name: 'Contested Premium Category Seats',
        key: 'contestedSeats',
        defaultValue: 100,
        unit: 'seats',
        min: 20,
        max: 1000,
        step: 20,
        description: 'Number of highly sought-after front-row / VIP seats opened simultaneously.'
      },
      {
        name: 'Users Targeting Premium Category at t = 0',
        key: 'usersTargetingCategory',
        defaultValue: 25000,
        unit: 'users',
        min: 1000,
        max: 100000,
        step: 1000,
        description: 'Subset of queued users clicking hold on the premium category within 500ms.'
      },
      {
        name: 'Waiting Room Metering Rate',
        key: 'admitRateUsersPerSec',
        defaultValue: 500,
        unit: 'users/sec',
        min: 100,
        max: 2000,
        step: 50,
        description: 'Velocity at which the edge token bucket admits users to the interactive seat map.'
      },
      {
        name: 'Total Venue Seat Inventory',
        key: 'totalVenueSeats',
        defaultValue: 60000,
        unit: 'seats',
        min: 500,
        max: 100000,
        step: 2500,
        description: 'Total capacity of the stadium or auditorium.'
      }
    ],
    formulas: [
      {
        name: 'Contention Intensity (C)',
        equation: 'C = Users_Targeting_Category / Contested_Seats',
        explanation: 'Number of concurrent write claims competing for each individual seat record.'
      },
      {
        name: 'Losing Requests Shed Instantly',
        equation: 'Requests_Shed = Users_Targeting_Category - Contested_Seats',
        explanation: 'Failing claims that must be rejected in RAM in < 2ms without touching the database.'
      },
      {
        name: 'Sale Completion Duration via Admission Rate',
        equation: 'T_sale = Total_Venue_Seats / Admit_Rate',
        explanation: 'Time required to meter prospective buyers through checkout matching DB write capacity.'
      }
    ],
    calculate: (inputs) => {
      const usersTargeting = inputs.usersTargetingCategory;
      const contestedSeats = inputs.contestedSeats;
      const totalSeats = inputs.totalVenueSeats;
      const admitRate = inputs.admitRateUsersPerSec;

      const contentionIntensity = usersTargeting / contestedSeats;
      const requestsShed = Math.max(0, usersTargeting - contestedSeats);
      const saleDurationSec = totalSeats / admitRate;

      return {
        metrics: [
          { label: 'Contention Intensity per Seat', value: contentionIntensity.toFixed(0), unit: 'claims/seat', highlight: true },
          { label: 'Requests Shed Instantly in Memory', value: requestsShed.toLocaleString(), unit: 'requests (99.6%)' },
          { label: 'Admission Queue Metering Velocity', value: admitRate.toLocaleString(), unit: 'users admitted/sec' },
          { label: 'Effective Inventory Drain Time', value: (saleDurationSec / 60).toFixed(1), unit: 'minutes' }
        ],
        takeaways: [
          `Contention of ${contentionIntensity.toFixed(0)} users per seat proves Amdahl's Law: adding database read replicas cannot speed up serialization on contested rows.`,
          `Redis Lua scripts reject ${requestsShed.toLocaleString()} losing requests in microseconds, protecting PostgreSQL from connection pool exhaustion.`,
          `The Virtual Waiting Room limits ingress to ${admitRate} users/sec, perfectly aligning traffic with PostgreSQL's 3,000–5,000 write QPS capacity.`
        ]
      };
    }
  },

  // Model 4: BookMyShow Ephemeral Lock Memory & DB Connection Pool
  {
    id: 'bookmyshow-locks',
    title: 'Model 4: Ephemeral Hold Memory Footprint & DB Connection Pool Sizing',
    domain: 'bookmyshow',
    objective: 'Calculate RAM consumption for platform-wide active seat holds and size PgBouncer connection multiplexers to prevent database thread collapse.',
    systemBoundary: 'In-Memory Ephemeral Lock Cluster (Redis 7.x) and Amazon Aurora PostgreSQL writer connection pools.',
    inputs: [
      {
        name: 'Platform Peak Concurrently Active Holds',
        key: 'activeHolds',
        defaultValue: 200000,
        unit: 'active holds',
        min: 20000,
        max: 1000000,
        step: 20000,
        description: 'Simultaneous 10-minute temporary seat reservations active across all scheduled events.'
      },
      {
        name: 'Checkout Hold Duration (TTL)',
        key: 'holdTtlSec',
        defaultValue: 600,
        unit: 'seconds (10m)',
        min: 300,
        max: 900,
        step: 60,
        description: 'Client checkout countdown timer before hold is automatically released.'
      },
      {
        name: 'Application Service Pod Count',
        key: 'appPodCount',
        defaultValue: 250,
        unit: 'pods',
        min: 50,
        max: 1000,
        step: 25,
        description: 'Stateless Kubernetes microservice pods dispatching database transactions.'
      },
      {
        name: 'Database Primary Writer Max Connections',
        key: 'maxDbConnections',
        defaultValue: 1000,
        unit: 'connections',
        min: 200,
        max: 2000,
        step: 100,
        description: 'Physical connection limit on primary Aurora PostgreSQL writer instance.'
      }
    ],
    formulas: [
      {
        name: 'Redis Key-Value Footprint',
        equation: 'RAM_per_key = Key_Bytes (40B) + Value_Bytes (160B) + Dict_Overhead (300B)',
        explanation: 'Average memory consumed per seat hold key in Redis dictionary.'
      },
      {
        name: 'Total Ephemeral Lock Memory',
        equation: 'RAM_total = Active_Holds * 500 bytes',
        explanation: 'Total working RAM required on the primary Redis node.'
      },
      {
        name: 'Unpooled Connection Demand',
        equation: 'Conn_demand = App_Pods * Internal_Pool_Size (10)',
        explanation: 'Connections requested if application pods connect directly to PostgreSQL.'
      },
      {
        name: 'PgBouncer Multiplexing Ratio',
        equation: 'Ratio = Conn_demand / Pooled_Server_Connections (150)',
        explanation: 'Connection concentration achieved via transaction-level connection pooling.'
      }
    ],
    calculate: (inputs) => {
      const activeHolds = inputs.activeHolds;
      const appPods = inputs.appPodCount;
      const maxConn = inputs.maxDbConnections;

      const totalMemoryMb = (activeHolds * 500) / (1024 * 1024);
      const unpooledDemand = appPods * 10;
      const pgbouncerServerConn = 150;
      const multiplexRatio = unpooledDemand / pgbouncerServerConn;

      return {
        metrics: [
          { label: 'Total Redis Ephemeral Lock RAM', value: totalMemoryMb.toFixed(1), unit: 'MB RAM', highlight: true },
          { label: 'Unpooled Database Connection Demand', value: unpooledDemand.toLocaleString(), unit: 'connections', note: unpooledDemand > maxConn ? 'EXHAUSTS POSTGRES WITHOUT PGBOUNCER' : 'Within limit' },
          { label: 'PgBouncer Dedicated Server Pool', value: pgbouncerServerConn.toString(), unit: 'server connections' },
          { label: 'Connection Multiplexing Ratio', value: multiplexRatio.toFixed(1) + ':1', unit: 'multiplex ratio', highlight: true }
        ],
        takeaways: [
          `Retaining ${activeHolds.toLocaleString()} simultaneous seat holds requires only ${totalMemoryMb.toFixed(1)} MB of RAM in Redis; memory is cheap, CPU serialization throughput is the true bottleneck.`,
          `Without PgBouncer, ${appPods} application pods would request ${unpooledDemand.toLocaleString()} connections, crashing PostgreSQL's max_connections limit of ${maxConn}.`,
          `Transaction pooling reduces server connections to ${pgbouncerServerConn}, keeping database context-switching overhead minimal.`
        ]
      };
    }
  }
];
