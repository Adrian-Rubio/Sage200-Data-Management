# debug_parser_output.py
import budget_parser
import json

def debug_output():
    # Test for Company 100
    print("--- Company 100 Budget Data Sample ---")
    data_100 = budget_parser.get_budget_data('100')
    count = 0
    for code, values in data_100.items():
        if any(v > 0 for v in values):
            print(f"Code: {code}, Values: {values}")
            count += 1
            if count >= 10: break
    print(f"Total non-zero accounts: {count}")

    # Test month range helper
    print("\n--- Month Range Helper (700000001) ---")
    p, a = budget_parser.get_account_budget('700000001', 1, 3, '100')
    print(f"Period (1-3): {p}, Accumulated (1-3): {a}")

if __name__ == "__main__":
    debug_output()
