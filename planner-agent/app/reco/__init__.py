"""Recommendation system (Hybrid LinUCB) package.

Modules:
    context        — TAG_VOCAB, dimension constants, feature engineering
    linucb         — LinUCB scoring engine, matrix ops, DB persistence
    ranker         — Post-processing pipeline (filters, diversity, exploration)
    tag_extractor  — LLM-powered tag extraction (Claude Sonnet)
    nightly_job    — Scheduled batch jobs (profiles, drift, tags)
    db_init        — Database initialization and startup checks
"""
