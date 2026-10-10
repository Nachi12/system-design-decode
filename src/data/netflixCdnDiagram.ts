import { Node, Edge } from '@xyflow/react';
import { ArchitectureNodeData } from '../types';

export const NETFLIX_CDN_DIAGRAM_TITLE = "Netflix Open Connect: Video Content Delivery Topology";
export const NETFLIX_CDN_DIAGRAM_EXPLANATION = 
  "A dedicated content delivery schematic showing the strict separation between AWS Cloud content preparation/steering and edge Open Connect Appliances (OCAs) delivering zero-copy 100+ Gbps media streams directly within ISP networks.";

export const NETFLIX_CDN_NODES: Node<ArchitectureNodeData>[] = [
  // 1. Content Preparation Plane (AWS)
  {
    id: 'cdn-transcoder',
    type: 'customNode',
    position: { x: 30, y: 80 },
    data: {
      label: 'Video Encoding & Transcoding',
      sublabel: 'Archer / Titus Compute Clusters',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Encodes raw studio mezzanine masters into multiple codec resolutions (AV1, HEVC, H.264) and audio formats across dynamic bitrates.',
      inputs: ['Studio master media assets from S3'],
      outputs: ['Chunked media segments (2-second to 6-second slices)'],
      dependencies: ['Amazon S3 Master Storage'],
      techStack: 'Custom distributed encoding pipeline running on Titus container platform',
      latencySla: 'Asynchronous offline batch encoding',
      failureMode: 'Automated task restart and slice retry across compute workers',
      citations: ['SRC-NFLX-CDN-01']
    }
  },
  {
    id: 'cdn-manifest',
    type: 'customNode',
    position: { x: 30, y: 260 },
    data: {
      label: 'DRM & Manifest Packaging',
      sublabel: 'License & Playback Metadata',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Generates title playback manifests (DASH, HLS, Smooth Streaming) with encryption keys (Widevine, FairPlay, PlayReady).',
      inputs: ['Encoded media chunks', 'DRM license keys'],
      outputs: ['Play manifest XML/JSON with signed media chunk URLs'],
      dependencies: ['DRM Key Store'],
      techStack: 'Java microservice, AWS EC2, Hardware Security Modules (HSM)',
      latencySla: '< 20ms manifest generation budget',
      failureMode: 'Caches static manifests in AWS S3 and regional API gateways',
      citations: ['SRC-NFLX-CDN-01']
    }
  },

  // 2. Control Plane (AWS)
  {
    id: 'cdn-control-plane',
    type: 'customNode',
    position: { x: 380, y: 80 },
    data: {
      label: 'Open Connect Control Plane',
      sublabel: 'Telemetry & Steering Engine',
      tier: 'DOCUMENTED',
      category: 'gateway',
      responsibility: 'Aggregates real-time health telemetry from all global OCAs; evaluates BGP routing tables to steer client video requests to the optimal appliance.',
      inputs: ['OCA health heartbeats', 'BGP route tables', 'Client IP prefix'],
      outputs: ['Target OCA IP address list ranked by network proximity and load'],
      dependencies: ['OCA Telemetry Collector'],
      techStack: 'AWS EC2, DNS Anycast, BGP route analyzer',
      latencySla: '< 10ms steering resolution budget',
      failureMode: 'Fallback to secondary IXP peer or central origin storage',
      citations: ['SRC-NFLX-CDN-01']
    }
  },
  {
    id: 'cdn-offpeak-sched',
    type: 'customNode',
    position: { x: 380, y: 260 },
    data: {
      label: 'Proactive Fill Coordinator',
      sublabel: 'Off-Peak Overnight Replicator',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Calculates title popularity forecasts per ISP; coordinates off-peak content replication (2 AM – 6 AM local time) to pre-position media chunks on edge disks.',
      inputs: ['Catalog viewing projections', 'Appliance disk inventory reports'],
      outputs: ['Off-peak fill job queues pushed to OCAs'],
      dependencies: ['Analytical Data Lake'],
      techStack: 'Batch scheduling service running on AWS',
      latencySla: 'Nightly 4-hour batch execution window',
      failureMode: 'Throttles replication if ISP transit bandwidth exceeds thresholds',
      citations: ['SRC-NFLX-CDN-01']
    }
  },

  // 3. Edge Delivery Plane (Open Connect)
  {
    id: 'cdn-ixp-peer',
    type: 'customNode',
    position: { x: 740, y: 80 },
    data: {
      label: 'IXP Transit & SFI Peering',
      sublabel: 'Settlement-Free Interconnection',
      tier: 'DOCUMENTED',
      category: 'external',
      responsibility: 'Exchanges high-bandwidth optical traffic directly with ISPs at public Internet Exchange Points (IXPs) without transit intermediary fees.',
      inputs: ['Overnight fill traffic from AWS', 'Transit fallback requests'],
      outputs: ['Direct optical interconnect traffic to ISP networks'],
      dependencies: ['Public IXP Switches (e.g. Equinix, DE-CIX)'],
      techStack: '100GbE / 400GbE optical routing hardware, BGP peering sessions',
      latencySla: '< 5ms regional IXP transit latency',
      failureMode: 'Dynamic BGP rerouting across redundant optical links',
      citations: ['SRC-NFLX-CDN-01']
    }
  },
  {
    id: 'cdn-isp-oca',
    type: 'customNode',
    position: { x: 740, y: 260 },
    data: {
      label: 'Embedded Open Connect Appliance',
      sublabel: 'Physical Server inside ISP Edge',
      tier: 'DOCUMENTED',
      category: 'cache',
      responsibility: 'Physical FreeBSD 1RU appliance deployed directly inside the ISP partner network; caches ~95% of streamed catalog hours locally.',
      inputs: ['HTTP/2 media chunk GET requests from local subscribers'],
      outputs: ['Encrypted video byte streams delivered at line rate'],
      dependencies: ['FreeBSD Kernel kTLS Engine'],
      techStack: 'FreeBSD Unix, custom NGINX, NVMe Solid-State Storage',
      latencySla: '< 10ms Time to First Byte (TTFB)',
      failureMode: 'Dual redundant power supplies, automatic DNS drain upon failure',
      citations: ['SRC-NFLX-CDN-01', 'SRC-NFLX-CDN-02']
    }
  },
  {
    id: 'cdn-ktls-engine',
    type: 'customNode',
    position: { x: 1080, y: 260 },
    data: {
      label: 'Zero-Copy Kernel TLS (kTLS)',
      sublabel: 'FreeBSD sendfile() Kernel Optimization',
      tier: 'DOCUMENTED',
      category: 'storage',
      responsibility: 'Streams encrypted media files directly from NVMe/SATA storage drives to the network adapter without copying bytes through user-space memory buffers.',
      inputs: ['Disk read requests from NGINX worker'],
      outputs: ['Zero-copy DMA transfers directly to NIC output queue'],
      dependencies: ['Smart NIC hardware with cryptographic offload'],
      techStack: 'FreeBSD sendfile, kTLS AES-GCM, TCP BBR congestion control',
      latencySla: 'Sustained throughput: 100+ Gbps per 1RU server',
      failureMode: 'Fallback to standard socket write if hardware crypto fails',
      citations: ['SRC-NFLX-CDN-02']
    }
  },

  // 4. Client Video Player
  {
    id: 'cdn-client-player',
    type: 'customNode',
    position: { x: 1080, y: 80 },
    data: {
      label: 'Client Video Playback Engine',
      sublabel: 'Adaptive Bitrate Player',
      tier: 'DOCUMENTED',
      category: 'client',
      responsibility: 'Monitors buffer fullness and throughput; dynamically switches video bitrate tracks to prevent rebuffering and playback interruptions.',
      inputs: ['Steering manifest from AWS', 'Media chunk stream from OCA'],
      outputs: ['Decoded video frames sent to display hardware; playback telemetry'],
      dependencies: ['Hardware Video Decoder (H.265 / AV1)'],
      techStack: 'ExoPlayer (Android/TV), AVPlayer (Apple), Custom HTML5 MSE Player',
      latencySla: '< 1500ms initial playback start time',
      failureMode: 'Adaptive bitrate downshift upon network degradation',
      citations: ['SRC-NFLX-CLIENT-01']
    }
  }
];

export const NETFLIX_CDN_EDGES: Edge[] = [
  { id: 'ce1', source: 'cdn-transcoder', target: 'cdn-manifest', label: 'Media Chunk Metadata', style: { stroke: '#94A3B8', strokeWidth: 1.5 } },
  { id: 'ce2', source: 'cdn-transcoder', target: 'cdn-offpeak-sched', label: 'Title Availability', style: { stroke: '#94A3B8', strokeWidth: 1.5 } },
  { id: 'ce3', source: 'cdn-offpeak-sched', target: 'cdn-ixp-peer', label: 'Overnight Replication Traffic', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } },
  { id: 'ce4', source: 'cdn-ixp-peer', target: 'cdn-isp-oca', label: 'Fill Edge Storage (Off-Peak)', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } },
  { id: 'ce5', source: 'cdn-manifest', target: 'cdn-client-player', label: 'Play Manifest JSON', animated: true, style: { stroke: '#06B6D4', strokeWidth: 1.5 } },
  { id: 'ce6', source: 'cdn-control-plane', target: 'cdn-client-player', label: 'Steering: Nearest OCA IP', animated: true, style: { stroke: '#06B6D4', strokeWidth: 1.5 } },
  { id: 'ce7', source: 'cdn-isp-oca', target: 'cdn-control-plane', label: 'Health Telemetry Reports', style: { stroke: '#10B981', strokeWidth: 1.5 } },
  { id: 'ce8', source: 'cdn-client-player', target: 'cdn-isp-oca', label: 'GET /media/chunk_04.mp4', animated: true, style: { stroke: '#E50914', strokeWidth: 2 } },
  { id: 'ce9', source: 'cdn-isp-oca', target: 'cdn-ktls-engine', label: 'sendfile() System Call', style: { stroke: '#06B6D4', strokeWidth: 1.5 } },
  { id: 'ce10', source: 'cdn-ktls-engine', target: 'cdn-client-player', label: '100 Gbps Zero-Copy Media Stream', animated: true, style: { stroke: '#E50914', strokeWidth: 2.5 } }
];
