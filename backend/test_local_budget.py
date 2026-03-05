# test_endpoint_pnl.py
import requests
import json

def test():
    # Login first if needed. I'll assume token is not valid yet or use valid credentials.
    # In real scenario I from authStore. Let's try calling directly and see if 401.
    # Actually, I can use the local IP or localhost.
    url = "http://localhost:8000/api/finance/pnl-detailed"
    # Note: this requires token. I'll mock the filter and check if I can get a response.
    # For now, let's just use Python's requests if I had a token.
    # Wait, I don't have user's token easily.
    
    # I'll just check if I can call budget_parser directly in a script on his machine.
    import budget_parser
    import pgc_mapping
    import pandas as pd
    
    # MOCK filters
    company_id = '100'
    m_from = 1
    m_to = 3
    
    budget_data = budget_parser.get_budget_data(company_id=company_id)
    print(f"Total budget accounts: {len(budget_data)}")
    
    # Check one specific account sum
    acc = '700000001'
    p, a = budget_parser.get_account_budget(acc, m_from, m_to, company_id=company_id)
    print(f"Account {acc} -> Period Budget: {p}, Accumulated: {a}")

if __name__ == "__main__":
    test()
