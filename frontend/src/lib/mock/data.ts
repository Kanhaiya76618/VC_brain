'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  abstract: string;
  arxivId?: string;
  doi?: string;
  citationCount: number;
  tags: string[];
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  readStatus: 'unread' | 'reading' | 'done';
  coverColor: string;
}

export interface CurriculumModule {
  id: string;
  title: string;
  stage: 'foundational' | 'intermediate' | 'advanced';
  description: string;
  papers: Paper[];
  estimatedHours: number;
  coverageScore: number;
}

export interface Curriculum {
  id: string;
  topic: string;
  createdAt: string;
  modules: CurriculumModule[];
  totalPapers: number;
  coveragePercent: number;
  gapCount: number;
  contradictionCount: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'paper' | 'concept';
  moduleId: string;
  x: number;
  y: number;
  weight: number;
  color: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: 'builds-on' | 'cites' | 'contradicts';
}

export interface CritiqueItem {
  id: string;
  type: 'gap' | 'contradiction' | 'outdated' | 'weak-source';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedPaperId?: string;
  affectedModuleId?: string;
  suggestion: string;
  status: 'open' | 'applied' | 'dismissed';
}

export interface CritiqueResponse {
  curriculumId: string;
  summary: string;
  overallScore: number;
  items: CritiqueItem[];
}

export interface Workspace {
  id: string;
  topic: string;
  description: string;
  createdAt: string;
  paperCount: number;
  coveragePercent: number;
  status: 'idle' | 'running' | 'done' | 'error';
  color: string;
}

// ─── Papers ───────────────────────────────────────────────────────────────────

export const MOCK_PAPERS: Paper[] = [
  {
    id: 'p001',
    title: 'Attention Is All You Need',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.', 'Uszkoreit, J.'],
    year: 2017,
    venue: 'NeurIPS',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    arxivId: '1706.03762',
    citationCount: 98420,
    tags: ['transformers', 'attention', 'sequence modeling'],
    difficulty: 'foundational',
    readStatus: 'done',
    coverColor: '#4f46e5',
  },
  {
    id: 'p002',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Devlin, J.', 'Chang, M.', 'Lee, K.', 'Toutanova, K.'],
    year: 2019,
    venue: 'NAACL',
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text.',
    arxivId: '1810.04805',
    citationCount: 72100,
    tags: ['BERT', 'pre-training', 'NLP'],
    difficulty: 'foundational',
    readStatus: 'done',
    coverColor: '#7c3aed',
  },
  {
    id: 'p003',
    title: 'Language Models are Few-Shot Learners',
    authors: ['Brown, T.', 'Mann, B.', 'Ryder, N.', 'Subbiah, M.'],
    year: 2020,
    venue: 'NeurIPS',
    abstract: 'We demonstrate that scaling language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
    arxivId: '2005.14165',
    citationCount: 41200,
    tags: ['GPT-3', 'few-shot', 'scaling'],
    difficulty: 'intermediate',
    readStatus: 'reading',
    coverColor: '#0d9488',
  },
  {
    id: 'p004',
    title: 'Scaling Laws for Neural Language Models',
    authors: ['Kaplan, J.', 'McCandlish, S.', 'Henighan, T.'],
    year: 2020,
    venue: 'arXiv',
    abstract: 'We study empirical scaling laws for language model performance on the cross-entropy loss. The loss scales as a power-law with model size, dataset size, and the amount of compute used for training.',
    arxivId: '2001.08361',
    citationCount: 8900,
    tags: ['scaling laws', 'compute', 'language models'],
    difficulty: 'intermediate',
    readStatus: 'unread',
    coverColor: '#d97706',
  },
  {
    id: 'p005',
    title: 'Training language models to follow instructions with human feedback',
    authors: ['Ouyang, L.', 'Wu, J.', 'Jiang, X.'],
    year: 2022,
    venue: 'NeurIPS',
    abstract: 'Making language models bigger does not inherently make them better at following a user\'s intent. We train GPT-3 to follow a broad class of written instructions using reinforcement learning from human feedback.',
    arxivId: '2203.02155',
    citationCount: 12400,
    tags: ['RLHF', 'instruction following', 'alignment'],
    difficulty: 'intermediate',
    readStatus: 'unread',
    coverColor: '#dc2626',
  },
  {
    id: 'p006',
    title: 'Constitutional AI: Harmlessness from AI Feedback',
    authors: ['Bai, Y.', 'Jones, A.', 'Ndousse, K.'],
    year: 2022,
    venue: 'arXiv',
    abstract: 'As AI systems become more capable, we would like to enlist their help to supervise other AIs. We experiment with methods for training a harmless AI assistant through self-improvement.',
    arxivId: '2212.08073',
    citationCount: 3200,
    tags: ['constitutional AI', 'safety', 'RLAIF'],
    difficulty: 'advanced',
    readStatus: 'unread',
    coverColor: '#7c3aed',
  },
  {
    id: 'p007',
    title: 'Sparks of Artificial General Intelligence: Early experiments with GPT-4',
    authors: ['Bubeck, S.', 'Chandrasekaran, V.', 'Eldan, R.'],
    year: 2023,
    venue: 'arXiv',
    abstract: 'We contend that GPT-4 is a significant step towards AGI, with its impressive performance across a variety of tasks that are typically considered to require human-level intelligence.',
    arxivId: '2303.12528',
    citationCount: 5600,
    tags: ['GPT-4', 'AGI', 'evaluation'],
    difficulty: 'advanced',
    readStatus: 'unread',
    coverColor: '#4f46e5',
  },
  {
    id: 'p008',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Lewis, P.', 'Perez, E.', 'Piktus, A.'],
    year: 2020,
    venue: 'NeurIPS',
    abstract: 'Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. We explore a general-purpose fine-tuning recipe for RAG.',
    arxivId: '2005.11401',
    citationCount: 9800,
    tags: ['RAG', 'retrieval', 'knowledge'],
    difficulty: 'intermediate',
    readStatus: 'unread',
    coverColor: '#0d9488',
  },
];

// ─── Curriculum ───────────────────────────────────────────────────────────────

/**
 * MOCK CURRICULUM — shaped to match POST /api/curriculum response.
 * To swap for real data: replace `MOCK_CURRICULUM` with the result of
 *   fetch('/api/curriculum', { method: 'POST', body: JSON.stringify({ topic }) })
 */
export const MOCK_CURRICULUM: Curriculum = {
  id: 'curr-001',
  topic: 'Attention Mechanisms in Transformers',
  createdAt: '2024-01-15T10:30:00Z',
  totalPapers: 8,
  coveragePercent: 74,
  gapCount: 3,
  contradictionCount: 1,
  modules: [
    {
      id: 'mod-001',
      title: 'Foundations of Attention',
      stage: 'foundational',
      description: 'Core papers establishing the attention mechanism and transformer architecture. Essential reading before anything else.',
      estimatedHours: 6,
      coverageScore: 92,
      papers: [MOCK_PAPERS[0], MOCK_PAPERS[1]],
    },
    {
      id: 'mod-002',
      title: 'Scaling & Emergence',
      stage: 'intermediate',
      description: 'How scale changes the game — GPT-3, scaling laws, and the emergence of few-shot capabilities.',
      estimatedHours: 8,
      coverageScore: 78,
      papers: [MOCK_PAPERS[2], MOCK_PAPERS[3]],
    },
    {
      id: 'mod-003',
      title: 'Alignment & Instruction Tuning',
      stage: 'intermediate',
      description: 'Making models useful and safe — RLHF, instruction following, and constitutional approaches.',
      estimatedHours: 7,
      coverageScore: 65,
      papers: [MOCK_PAPERS[4], MOCK_PAPERS[5]],
    },
    {
      id: 'mod-004',
      title: 'Frontier Models & RAG',
      stage: 'advanced',
      description: 'State-of-the-art capabilities, AGI discussions, and retrieval-augmented approaches.',
      estimatedHours: 10,
      coverageScore: 58,
      papers: [MOCK_PAPERS[6], MOCK_PAPERS[7]],
    },
  ],
};

// ─── Knowledge Graph ──────────────────────────────────────────────────────────

export const MOCK_GRAPH_NODES: GraphNode[] = [
  { id: 'p001', label: 'Attention Is All You Need', type: 'paper', moduleId: 'mod-001', x: 300, y: 200, weight: 10, color: '#4f46e5' },
  { id: 'p002', label: 'BERT', type: 'paper', moduleId: 'mod-001', x: 180, y: 320, weight: 9, color: '#7c3aed' },
  { id: 'p003', label: 'GPT-3', type: 'paper', moduleId: 'mod-002', x: 450, y: 150, weight: 8, color: '#0d9488' },
  { id: 'p004', label: 'Scaling Laws', type: 'paper', moduleId: 'mod-002', x: 560, y: 280, weight: 6, color: '#d97706' },
  { id: 'p005', label: 'InstructGPT', type: 'paper', moduleId: 'mod-003', x: 420, y: 380, weight: 7, color: '#dc2626' },
  { id: 'p006', label: 'Constitutional AI', type: 'paper', moduleId: 'mod-003', x: 280, y: 450, weight: 5, color: '#7c3aed' },
  { id: 'p007', label: 'GPT-4 Sparks', type: 'paper', moduleId: 'mod-004', x: 600, y: 150, weight: 6, color: '#4f46e5' },
  { id: 'p008', label: 'RAG', type: 'paper', moduleId: 'mod-004', x: 160, y: 180, weight: 6, color: '#0d9488' },
  { id: 'c001', label: 'Self-Attention', type: 'concept', moduleId: 'mod-001', x: 340, y: 100, weight: 7, color: '#6366f1' },
  { id: 'c002', label: 'Pre-training', type: 'concept', moduleId: 'mod-001', x: 120, y: 240, weight: 6, color: '#8b5cf6' },
  { id: 'c003', label: 'RLHF', type: 'concept', moduleId: 'mod-003', x: 500, y: 420, weight: 5, color: '#dc2626' },
];

export const MOCK_GRAPH_EDGES: GraphEdge[] = [
  { id: 'e001', source: 'p001', target: 'c001', relation: 'builds-on' },
  { id: 'e002', source: 'p002', target: 'p001', relation: 'builds-on' },
  { id: 'e003', source: 'p002', target: 'c002', relation: 'builds-on' },
  { id: 'e004', source: 'p003', target: 'p001', relation: 'builds-on' },
  { id: 'e005', source: 'p003', target: 'p004', relation: 'cites' },
  { id: 'e006', source: 'p005', target: 'p003', relation: 'builds-on' },
  { id: 'e007', source: 'p005', target: 'c003', relation: 'builds-on' },
  { id: 'e008', source: 'p006', target: 'p005', relation: 'builds-on' },
  { id: 'e009', source: 'p006', target: 'c003', relation: 'cites' },
  { id: 'e010', source: 'p007', target: 'p003', relation: 'builds-on' },
  { id: 'e011', source: 'p008', target: 'p002', relation: 'builds-on' },
  { id: 'e012', source: 'p004', target: 'p001', relation: 'cites' },
  { id: 'e013', source: 'p007', target: 'p005', relation: 'cites' },
  { id: 'e014', source: 'p008', target: 'c001', relation: 'cites' },
  { id: 'e015', source: 'p006', target: 'p007', relation: 'contradicts' },
];

// ─── Critique ─────────────────────────────────────────────────────────────────

/**
 * MOCK CRITIQUE — shaped to match POST /api/critique response.
 * To swap for real data: replace `MOCK_CRITIQUE` with the result of
 *   fetch('/api/critique', { method: 'POST', body: JSON.stringify({ curriculumId: 'curr-001' }) })
 */
export const MOCK_CRITIQUE: CritiqueResponse = {
  curriculumId: 'curr-001',
  summary: 'The curriculum provides solid foundational coverage of transformer architectures and scaling, but has notable gaps in multimodal attention, efficient attention variants (Flash Attention, Longformer), and recent mechanistic interpretability work. One contradiction detected between Constitutional AI claims and InstructGPT empirical results.',
  overallScore: 74,
  items: [
    {
      id: 'cr-001',
      type: 'gap',
      severity: 'high',
      title: 'Missing: Efficient Attention Variants',
      description: 'Flash Attention (Dao et al., 2022) and Longformer are absent. These are now standard in production systems and critical for understanding modern LLM training.',
      affectedModuleId: 'mod-001',
      suggestion: 'Add Flash Attention (arXiv:2205.14135) to Module 1 as a required paper.',
      status: 'open',
    },
    {
      id: 'cr-002',
      type: 'contradiction',
      severity: 'high',
      title: 'Contradicted Claim: RLHF Superiority',
      description: 'Constitutional AI (p006) claims RLAIF matches RLHF without human labels, but InstructGPT (p005) data shows human feedback remains superior on nuanced tasks. Both papers are presented without flagging this tension.',
      affectedPaperId: 'p006',
      suggestion: 'Add a cross-reference note linking p005 and p006 with a discussion of the empirical disagreement.',
      status: 'open',
    },
    {
      id: 'cr-003',
      type: 'gap',
      severity: 'medium',
      title: 'Missing: Multimodal Attention',
      description: 'No coverage of vision-language models (CLIP, Flamingo, GPT-4V). Module 4 discusses GPT-4 capabilities without the multimodal architecture papers.',
      affectedModuleId: 'mod-004',
      suggestion: 'Add CLIP (arXiv:2103.00020) and Flamingo (arXiv:2204.14198) to Module 4.',
      status: 'open',
    },
    {
      id: 'cr-004',
      type: 'outdated',
      severity: 'medium',
      title: 'Outdated: Scaling Laws Paper',
      description: 'Kaplan et al. (2020) scaling laws have been substantially revised by Chinchilla (Hoffmann et al., 2022), which shows the original compute-optimal ratios were off by ~4×.',
      affectedPaperId: 'p004',
      suggestion: 'Add Chinchilla (arXiv:2203.15556) and annotate p004 as superseded in compute-optimal recommendations.',
      status: 'open',
    },
    {
      id: 'cr-005',
      type: 'weak-source',
      severity: 'low',
      title: 'Weak Source: GPT-4 Sparks Paper',
      description: 'The "Sparks of AGI" paper (p007) is a Microsoft Research blog-style paper with contested methodology. Several claims lack rigorous empirical backing.',
      affectedPaperId: 'p007',
      suggestion: 'Supplement with Marcus & Davis (2023) critique and ARC evaluation papers for balance.',
      status: 'open',
    },
    {
      id: 'cr-006',
      type: 'gap',
      severity: 'low',
      title: 'Missing: Mechanistic Interpretability',
      description: 'No coverage of what attention heads actually compute — Anthropic\'s superposition work and Olah et al. circuits research are absent.',
      affectedModuleId: 'mod-001',
      suggestion: 'Add "A Mathematical Framework for Transformer Circuits" (Elhage et al., 2021) as optional reading.',
      status: 'open',
    },
  ],
};

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws-001',
    topic: 'Attention Mechanisms in Transformers',
    description: 'Deep dive into self-attention, multi-head attention, and transformer architectures',
    createdAt: '2024-01-15T10:30:00Z',
    paperCount: 8,
    coveragePercent: 74,
    status: 'done',
    color: '#4f46e5',
  },
  {
    id: 'ws-002',
    topic: 'Diffusion Models for Image Generation',
    description: 'DDPM, DDIM, Stable Diffusion, and score-based generative models',
    createdAt: '2024-01-10T14:00:00Z',
    paperCount: 12,
    coveragePercent: 88,
    status: 'done',
    color: '#0d9488',
  },
  {
    id: 'ws-003',
    topic: 'Reinforcement Learning from Human Feedback',
    description: 'RLHF, PPO, reward modeling, and alignment techniques',
    createdAt: '2024-01-08T09:00:00Z',
    paperCount: 6,
    coveragePercent: 52,
    status: 'running',
    color: '#d97706',
  },
  {
    id: 'ws-004',
    topic: 'Graph Neural Networks',
    description: 'GCN, GAT, GraphSAGE, and applications in drug discovery',
    createdAt: '2024-01-05T16:00:00Z',
    paperCount: 9,
    coveragePercent: 61,
    status: 'idle',
    color: '#7c3aed',
  },
];

// ─── Multi-Agent System ───────────────────────────────────────────────────────

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
  stage: number;
}

/**
 * Describes the real agent pipeline implemented in backend/lib/.
 * Purely descriptive — used to render the "About" pipeline diagram.
 */
export const MOCK_AGENTS: AgentInfo[] = [
  {
    id: 'search',
    name: 'Search Agents',
    role: 'arXiv + Semantic Scholar',
    description: 'Retrieve candidate papers for a topic from arXiv and Semantic Scholar.',
    color: '#0d9488',
    stage: 1,
  },
  {
    id: 'curriculum',
    name: 'Curriculum Agent',
    role: 'Sequencing',
    description: 'Ranks and sequences retrieved papers into foundational → advanced modules with a rationale for each.',
    color: '#4f46e5',
    stage: 2,
  },
  {
    id: 'graph',
    name: 'Knowledge Graph Orchestrator',
    role: 'Structuring',
    description: 'Builds the paper/concept graph — builds-on, cites, and contradicts relationships — from the curriculum.',
    color: '#d97706',
    stage: 3,
  },
  {
    id: 'critic',
    name: 'Critic Agent',
    role: 'Review',
    description: 'Audits the curriculum for coverage gaps, contradictions, outdated claims, and weak sources.',
    color: '#dc2626',
    stage: 4,
  },
];

// ─── Assistant ────────────────────────────────────────────────────────────────

export interface AssistantQA {
  id: string;
  question: string;
  answer: string;
}

/**
 * Mock canned answers for the Help Assistant widget.
 * To swap for a real assistant: replace `matchAssistantAnswer` with a call to lib/llm.ts.
 */
export const MOCK_ASSISTANT_QA: AssistantQA[] = [
  {
    id: 'qa-001',
    question: 'How do I generate a curriculum?',
    answer: "Type a topic into the search bar on Home and hit “Run Pipeline.” The Curriculum Agent fetches papers via arXiv & Semantic Scholar, sequences them into modules, then hands off to the Critic Agent for review.",
  },
  {
    id: 'qa-002',
    question: 'What does the Critic Agent do?',
    answer: 'It reviews your curriculum for coverage gaps, contradictions, outdated claims, and weak sources, then suggests a specific paper or note to fix each issue — see the Critic panel on the Curriculum page.',
  },
  {
    id: 'qa-003',
    question: 'What is the Knowledge Graph?',
    answer: "A visual map of how your papers and concepts relate — builds-on, cites, and contradicts edges — generated by the Knowledge Graph Orchestrator from your curriculum. Open it from the Curriculum page's “Knowledge Graph” tab.",
  },
  {
    id: 'qa-004',
    question: 'How do I take notes on a paper?',
    answer: 'Open any paper in the Library, then use the Notes panel on the side to jot down thoughts — notes are kept per paper.',
  },
];

export const ASSISTANT_FALLBACK =
  "I'm a mock assistant for now — try one of the suggested questions above, or wire this up to a real model in lib/llm.ts.";

// ─── Search Results ───────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  type: 'paper' | 'topic' | 'note' | 'workspace';
  title: string;
  subtitle: string;
  href: string;
}

export const MOCK_SEARCH_RESULTS: SearchResult[] = [
  { id: 'sr-001', type: 'paper', title: 'Attention Is All You Need', subtitle: 'Vaswani et al. · NeurIPS 2017', href: '/paper-reader' },
  { id: 'sr-002', type: 'paper', title: 'BERT: Pre-training of Deep Bidirectional Transformers', subtitle: 'Devlin et al. · NAACL 2019', href: '/paper-reader' },
  { id: 'sr-003', type: 'topic', title: 'Attention Mechanisms in Transformers', subtitle: 'Workspace · 8 papers · 74% coverage', href: '/curriculum-view' },
  { id: 'sr-004', type: 'workspace', title: 'Diffusion Models for Image Generation', subtitle: 'Workspace · 12 papers · 88% coverage', href: '/curriculum-view' },
  { id: 'sr-005', type: 'note', title: 'Notes on Flash Attention', subtitle: 'Personal note · Jan 15', href: '/paper-reader' },
];
