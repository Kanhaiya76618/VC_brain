'use client';
import React, { useState } from 'react';
import { AlertTriangle, XCircle, Clock, ChevronDown, ChevronUp, Quote, Users, Calendar, Hash } from 'lucide-react';

const PAPER = {
  id: 'paper-001',
  title: 'Attention Is All You Need',
  authors: [
    { id: 'auth-001', name: 'Ashish Vaswani', affiliation: 'Google Brain' },
    { id: 'auth-002', name: 'Noam Shazeer', affiliation: 'Google Brain' },
    { id: 'auth-003', name: 'Niki Parmar', affiliation: 'Google Research' },
    { id: 'auth-004', name: 'Jakob Uszkoreit', affiliation: 'Google Research' },
    { id: 'auth-005', name: 'Llion Jones', affiliation: 'Google Research' },
    { id: 'auth-006', name: 'Aidan N. Gomez', affiliation: 'University of Toronto' },
    { id: 'auth-007', name: 'Łukasz Kaiser', affiliation: 'Google Brain' },
    { id: 'auth-008', name: 'Illia Polosukhin', affiliation: 'Independent' },
  ],
  venue: 'NeurIPS 2017',
  year: 2017,
  arxivId: '1706.03762',
  doi: '10.48550/arXiv.1706.03762',
  citations: 98421,
  pages: 15,
  abstract: `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing with both large and limited training data.`,
  keywords: ['Transformer', 'Self-Attention', 'Multi-Head Attention', 'Encoder-Decoder', 'Machine Translation', 'Sequence Transduction'],
  sections: [
    {
      id: 'sec-intro',
      title: '1. Introduction',
      content: `Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation. Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures.

Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states h_t, as a function of the previous hidden state h_{t−1} and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.

The fundamental constraint of sequential computation, however, remains. In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.`,
      critique: null,
    },
    {
      id: 'sec-model',
      title: '2. Model Architecture',
      content: `Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations (x_1, ..., x_n) to a sequence of continuous representations z = (z_1, ..., z_n). Given z, the decoder then generates an output sequence (y_1, ..., y_m) of symbols one element at a time.

The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder. The encoder and decoder stacks each use d_model = 512 dimensional embeddings. The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers: a multi-head self-attention mechanism, and a simple, position-wise fully connected feed-forward network.

An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

We call our particular attention "Scaled Dot-Product Attention". The input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the dot products of the query with all keys, divide each by √d_k, and apply a softmax function to obtain the weights on the values.`,
      critique: null,
    },
    {
      id: 'sec-attention',
      title: '3. Attention',
      content: `Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this. Multi-head attention with h = 8 parallel attention heads is used throughout this work.

The Transformer uses multi-head attention in three different ways: In "encoder-decoder attention" layers, the queries come from the previous decoder layer, and the memory keys and values come from the output of the encoder. In the encoder, the encoder contains self-attention layers. Finally, the decoder contains self-attention layers that allow each position in the decoder to attend to all positions in the decoder up to and including that position.

Positional Encoding: Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add "positional encodings" to the input embeddings at the bottoms of the encoder and decoder stacks.`,
      critique: 'gap' as const,
    },
    {
      id: 'sec-results',
      title: '4. Results',
      content: `On the WMT 2014 English-to-German translation task, the big transformer model outperforms the best previously reported models including ensembles by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4. On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.0, outperforming all of the previously published single models, at less than 1/4 the training cost of the previous state-of-the-art model.

The Transformer achieves 2.0 BLEU points better than previously reported models on English-to-German, while training in 3.5 days on 8 P100 GPUs. This represents a significant reduction in training cost compared to recurrent architectures.`,
      critique: 'outdated' as const,
    },
  ],
  inlineCritiques: [
    {
      id: 'ic-001',
      sectionId: 'sec-attention',
      type: 'gap' as const,
      text: 'Positional encoding section does not cover relative or rotary positional embeddings (RoPE, ALiBi), which are now standard in modern LLMs.',
    },
    {
      id: 'ic-002',
      sectionId: 'sec-results',
      type: 'outdated' as const,
      text: 'BLEU scores reported here have been surpassed by subsequent models. These results are now primarily of historical significance.',
    },
  ],
};

const critiqueInlineConfig = {
  gap: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/8 border-amber-500/20' },
  contradiction: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/8 border-red-500/20' },
  outdated: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/8 border-slate-500/20' },
};

export default function PaperBody() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(PAPER.sections.map((s) => [s.id, true]))
  );
  const [showAllAuthors, setShowAllAuthors] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleAuthors = showAllAuthors ? PAPER.authors : PAPER.authors.slice(0, 4);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Paper title */}
      <h1 className="text-2xl font-bold text-foreground leading-tight mb-4">
        {PAPER.title}
      </h1>

      {/* Authors */}
      <div className="mb-4">
        <div className="flex items-start gap-2 flex-wrap">
          <Users size={13} className="text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {visibleAuthors.map((author) => (
              <span key={author.id} className="text-sm text-accent hover:underline cursor-pointer">
                {author.name}
                <span className="text-muted-foreground text-[11px] font-mono ml-0.5">
                  ({author.affiliation})
                </span>
              </span>
            ))}
            {!showAllAuthors && PAPER.authors.length > 4 && (
              <button
                onClick={() => setShowAllAuthors(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                +{PAPER.authors.length - 4} more
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-6 p-3 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <Calendar size={11} className="text-muted-foreground" />
          <span className="text-muted-foreground">Published</span>
          <span className="text-foreground font-semibold">{PAPER.venue} · {PAPER.year}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <Hash size={11} className="text-muted-foreground" />
          <span className="text-muted-foreground">arXiv:</span>
          <a
            href={`https://arxiv.org/abs/${PAPER.arxivId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {PAPER.arxivId}
          </a>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <Quote size={11} className="text-muted-foreground" />
          <span className="text-muted-foreground">Citations:</span>
          <span className="text-foreground font-semibold tabular-nums">
            {PAPER.citations.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-muted-foreground">Pages:</span>
          <span className="text-foreground font-semibold tabular-nums">{PAPER.pages}</span>
        </div>
      </div>

      {/* Keywords */}
      <div className="flex items-center flex-wrap gap-1.5 mb-6">
        {PAPER.keywords.map((kw) => (
          <span
            key={`kw-${kw}`}
            className="text-[10px] font-mono px-2 py-1 rounded-md bg-primary/10 text-accent border border-primary/20"
          >
            {kw}
          </span>
        ))}
      </div>

      {/* Abstract */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          Abstract
          <div className="flex-1 h-px bg-border" />
        </h2>
        <div className="glass-panel rounded-xl p-5 border border-border">
          <p className="text-sm text-foreground leading-relaxed">
            {PAPER.abstract}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {PAPER.sections.map((section) => {
          const isExpanded = expandedSections[section.id];
          const inlineCritique = PAPER.inlineCritiques.find((ic) => ic.sectionId === section.id);

          return (
            <div key={section.id} className="glass-panel rounded-xl border border-border overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-foreground">{section.title}</h2>
                  {section.critique && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      section.critique === 'gap' ?'bg-amber-500/15 text-amber-400 border-amber-500/20'
                        : section.critique === 'outdated' ?'bg-slate-500/15 text-slate-400 border-slate-500/20' :'bg-red-500/15 text-red-400 border-red-500/20'
                    }`}>
                      {section.critique}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={14} className="text-muted-foreground" />
                )}
              </button>

              {/* Section content */}
              {isExpanded && (
                <div className="px-5 pb-5">
                  <div className="space-y-3">
                    {section.content.split('\n\n').map((para, pi) => (
                      <p
                        key={`para-${section.id}-${pi}`}
                        className="text-sm text-foreground leading-relaxed"
                      >
                        {para}
                      </p>
                    ))}
                  </div>

                  {/* Inline critique annotation */}
                  {inlineCritique && (
                    <div className={`mt-4 rounded-lg px-4 py-3 border ${critiqueInlineConfig[inlineCritique.type].bg}`}>
                      <div className="flex items-start gap-2">
                        {React.createElement(critiqueInlineConfig[inlineCritique.type].icon, {
                          size: 13,
                          className: `${critiqueInlineConfig[inlineCritique.type].color} shrink-0 mt-0.5`,
                        })}
                        <div>
                          <p className={`text-[10px] font-mono font-semibold uppercase tracking-widest mb-1 ${critiqueInlineConfig[inlineCritique.type].color}`}>
                            Critique Agent · {inlineCritique.type}
                          </p>
                          <p className="text-[11px] text-foreground leading-relaxed">
                            {inlineCritique.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Citation block */}
      <div className="mt-8 glass-panel rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          BibTeX Citation
          <div className="flex-1 h-px bg-border" />
        </h2>
        <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed overflow-x-auto scrollbar-thin bg-muted/20 rounded-lg p-4">
{`@inproceedings{vaswani2017attention,
  title     = {Attention Is All You Need},
  author    = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki
               and Uszkoreit, Jakob and Jones, Llion
               and Gomez, Aidan N and Kaiser, {\\L}ukasz
               and Polosukhin, Illia},
  booktitle = {Advances in Neural Information Processing Systems},
  volume    = {30},
  year      = {2017},
  url       = {https://arxiv.org/abs/1706.03762}
}`}
        </pre>
      </div>
    </div>
  );
}