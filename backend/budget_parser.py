# budget_parser.py
import pandas as pd
import re
import os

_budget_cache = {}

# Standardize path based on script location (backend/budget_parser.py)
# Root is one level up from backend
_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEFAULT_FILE = os.path.join(_ROOT_DIR, "P&G Grupo Cenval 2026 v1.xlsx")

COMPANY_SHEET_MAP = {
    '100': 'Total grupo',
    '2': 'Cenvalsa industrial',
    '4': 'D&M',
    '6': 'Saratur'
}

def get_budget_data(company_id='100', file_path=None):
    global _budget_cache
    
    company_id = str(company_id) # Ensure string
    
    if file_path is None:
        file_path = _DEFAULT_FILE
    
    # Check cache
    if company_id in _budget_cache:
       return _budget_cache[company_id]
    
    abs_path = os.path.abspath(file_path)
    print(f"DEBUG: Attempting to open budget file at: {abs_path}")
    
    if not os.path.exists(abs_path):
        print(f"Warning: Budget file {abs_path} not found.")
        return {}
    
    sheet_name = COMPANY_SHEET_MAP.get(company_id, 'Total grupo')
    print(f"DEBUG: Opening Excel sheet '{sheet_name}' for company '{company_id}'")
    
    try:
        xls = pd.ExcelFile(file_path)
        if sheet_name not in xls.sheet_names:
            print(f"Warning: Sheet {sheet_name} not found in {file_path}. Available: {xls.sheet_names}")
            return {}
            
        df = pd.read_excel(xls, sheet_name=sheet_name)
        # Robustly trim column names
        df.columns = [str(c).strip() for c in df.columns]
        
        budget_map = {}
        
        # Primary columns for 2026 budget are ene.1, feb.1 ... dic.1
        primary_months = ['ene.1', 'feb.1', 'mar.1', 'abr.1', 'may.1', 'jun.1', 
                          'jul.1', 'ago.1', 'sep.1', 'oct.1', 'nov.1', 'dic.1']
        
        # Fallback columns (e.g., for Saratur) are ene, feb ... dic
        fallback_months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                           'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
        
        # Determine which set of columns to use
        # Check first column (ene.1) to decide
        use_fallback = 'ene.1' not in df.columns
        month_cols = fallback_months if use_fallback else primary_months
        
        desc_col = df.columns[0]
        
        for _, row in df.iterrows():
            desc = str(row[desc_col]).strip()
            # Match 6 to 10 digits at the start, ignoring initial whitespace
            # Some entries might have more spaces then others
            match = re.search(r'(\d{6,10})', desc)
            if match:
                code = match.group(1)
                # Map months 1-12
                values = []
                for m_col in month_cols:
                    if m_col in row:
                        val = row[m_col]
                        try:
                            # Use pandas pd.to_numeric to safely convert, or float()
                            f_val = float(val) if pd.notnull(val) else 0.0
                        except:
                            f_val = 0.0
                        values.append(f_val)
                    else:
                        values.append(0.0)
                
                budget_map[code] = values
                
        if budget_map:
            _budget_cache[company_id] = budget_map
        else:
            print(f"DEBUG: No budget data found in sheet '{sheet_name}' for company '{company_id}'")
            
        return budget_map
    except Exception as e:
        print(f"Error parsing budget excel for company {company_id}: {e}")
        import traceback
        traceback.print_exc()
        return {}

def get_account_budget(account_code, month_from, month_to, company_id='100'):
    """
    Returns (period_budget, accumulated_budget) for a given account and range.
    Accumulated is always from month 1 to month_to.
    Period is from month_from to month_to.
    """
    data = get_budget_data(company_id=company_id)
    
    if account_code not in data:
        return 0.0, 0.0
        
    months = data[account_code]
    
    # Period: sum from month_from to month_to
    # months is 0-indexed, so 1 -> 0, 12 -> 11
    period_budget = sum(months[max(0, month_from-1) : min(12, month_to)])
    
    # Accumulated: sum from 1 to month_to
    accumulated_budget = sum(months[:min(12, month_to)])
    
    return period_budget, accumulated_budget
