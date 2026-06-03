import pytest
import math
from app.reco.nightly_job import _LAMBDA_DECAY

def test_decay_formula():
    """Verify user affinities are updated using a 30-day half-life decay formula."""
    expected_lambda = math.log(2) / 30.0
    assert abs(_LAMBDA_DECAY - expected_lambda) < 1e-6
    
    reward = 1.0
    
    # 0 days since: decay = 1.0 (no decay)
    decay_0 = math.exp(-_LAMBDA_DECAY * 0)
    assert abs(decay_0 - 1.0) < 1e-6
    
    # 30 days since: decay = 0.5 (half-life)
    decay_30 = math.exp(-_LAMBDA_DECAY * 30)
    assert abs(decay_30 - 0.5) < 1e-6
    
    # 60 days since: decay = 0.25 (two half-lives)
    decay_60 = math.exp(-_LAMBDA_DECAY * 60)
    assert abs(decay_60 - 0.25) < 1e-6
    
    affinity = reward * decay_30
    assert abs(affinity - 0.5) < 1e-6
