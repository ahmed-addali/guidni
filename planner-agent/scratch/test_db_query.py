import sys
import os
import json

# Add project root to path
sys.path.append(os.getcwd())

from app.reco.db import get_arms_for_zone

def test():
    zone = "djerba"
    types = ["STAY"]
    print(f"Testing zone='{zone}', types={types}")
    arms = get_arms_for_zone(zone, types)
    print(f"Result: {len(arms)} arms")
    for arm in arms[:2]:
        print(f" - {arm.listing_id} ({arm.listing_type}) price={arm.price}")

if __name__ == "__main__":
    test()
