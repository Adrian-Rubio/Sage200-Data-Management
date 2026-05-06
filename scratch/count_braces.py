
content = open(r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\frontend\src\pages\DubesDashboard.jsx", "r", encoding="utf-8").read()
print(f"Open: {content.count('{')}")
print(f"Close: {content.count('}')}")
