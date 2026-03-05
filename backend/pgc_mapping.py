# pgc_mapping.py
# Define la estructura jerárquica de la Cuenta de Pérdidas y Ganancias (P&G)
# Basado en el Plan General Contable (PGC) español y la captura de pantalla de Sage.

PGC_PG_STRUCTURE = [
    {
        "id": "A",
        "name": "A) Operaciones continuadas",
        "children": [
            {
                "id": "A1",
                "name": "1. Importe neto de la cifra de negocios",
                "children": [
                    {
                        "id": "A1a",
                        "name": "a) Ventas",
                        "patterns": ["700%", "701%", "702%", "703%", "704%", "709%"]
                    },
                    {
                        "id": "A1b",
                        "name": "b) Prestaciones de servicios",
                        "patterns": ["705%", "706%", "708%"]
                    }
                ]
            },
            {
                "id": "A2",
                "name": "2. Variación de existencias de prod. term. y en curso",
                "patterns": ["71%"]
            },
            {
                "id": "A3",
                "name": "3. Trabajos realizados por la empresa para su activo",
                "patterns": ["73%"]
            },
            {
                "id": "A4",
                "name": "4. Aprovisionamientos",
                "children": [
                    {
                        "id": "A4a",
                        "name": "a) Consumo de mercaderías",
                        "patterns": ["600%", "601%", "602%", "606%", "607%", "61%"]
                    },
                    {
                        "id": "A4b",
                        "name": "b) Consumo de materias primas y otras mat. cons.",
                        "patterns": ["602%"] # Sage usually separates based on sub-accounts
                    },
                    {
                        "id": "A4c",
                        "name": "c) Trabajos realizados por otras empresas",
                        "patterns": ["607%"]
                    },
                    {
                        "id": "A4d",
                        "name": "d) Deterioro de mercaderías, mat. primas y otros",
                        "patterns": ["693%", "793%"]
                    }
                ]
            },
            {
                "id": "A5",
                "name": "5. Otros ingresos de explotación",
                "children": [
                    {
                        "id": "A5a",
                        "name": "a) Ingresos accesorios y otros de gestión corriente",
                        "patterns": ["75%"]
                    },
                    {
                        "id": "A5b",
                        "name": "b) Subvenciones de explotación incorporadas al rtdo.",
                        "patterns": ["740%", "747%"]
                    }
                ]
            },
            {
                "id": "A6",
                "name": "6. Gastos de personal",
                "children": [
                    {
                        "id": "A6a",
                        "name": "a) Sueldos, salarios y asimilados",
                        "patterns": ["640%", "641%", "645%"]
                    },
                    {
                        "id": "A6b",
                        "name": "b) Cargas sociales",
                        "patterns": ["642%", "643%", "649%"]
                    },
                    {
                        "id": "A6c",
                        "name": "c) Provisiones",
                        "patterns": ["644%", "7950%"]
                    }
                ]
            },
            {
                "id": "A7",
                "name": "7. Otros gastos de explotación",
                "children": [
                    {
                        "id": "A7a",
                        "name": "a) Servicios exteriores",
                        "patterns": ["62%"]
                    },
                    {
                        "id": "A7b",
                        "name": "b) Tributos",
                        "patterns": ["631%", "634%", "636%", "639%"]
                    },
                    {
                        "id": "A7c",
                        "name": "c) Pérdidas, deterioro y var. provisiones op. com.",
                        "patterns": ["650%", "694%", "695%", "794%", "7954%"]
                    },
                    {
                        "id": "A7d",
                        "name": "d) Otros gastos de gestión corriente",
                        "patterns": ["651%", "659%"]
                    }
                ]
            },
            {
                "id": "A8",
                "name": "8. Amortización del inmovilizado",
                "patterns": ["68%"]
            },
            {
                "id": "A9",
                "name": "9. Imputación de subvenciones de inmov. no fin. y otras",
                "patterns": ["746%"]
            },
            {
                "id": "A10",
                "name": "10. Excesos de provisiones",
                "patterns": ["7951%", "7952%", "7955%", "7956%"]
            },
            {
                "id": "A11",
                "name": "11. Deterioro y resultado por enajenaciones del inmov.",
                "patterns": ["670%", "671%", "672%", "690%", "691%", "692%", "770%", "771%", "772%", "790%", "791%", "792%"]
            },
            {
                "id": "A12",
                "name": "12. Otros resultados",
                "patterns": ["678%", "778%"]
            }
        ]
    },
    {
        "id": "B",
        "name": "B) Resultado Financiero",
        "children": [
            {
                "id": "B14",
                "name": "14. Ingresos financieros",
                "patterns": ["760%", "761%", "762%", "767%", "769%"]
            },
            {
                "id": "B15",
                "name": "15. Gastos financieros",
                "patterns": ["660%", "661%", "662%", "664%", "665%", "666%", "667%", "669%"]
            },
            {
                "id": "B16",
                "name": "16. Variación de valor razonable en instrum. fin.",
                "patterns": ["663%", "763%"]
            },
            {
                "id": "B17",
                "name": "17. Diferencias de cambio",
                "patterns": ["668%", "768%"]
            },
            {
                "id": "B18",
                "name": "18. Deterioro y rtdo. por enajenaciones de inst. fin.",
                "patterns": ["666%", "667%", "673%", "675%", "696%", "697%", "698%", "699%", "766%", "773%", "775%", "796%", "797%", "798%", "799%"]
            }
        ]
    }
]

def find_pgc_node(account_code, structure=PGC_PG_STRUCTURE):
    """
    Encuentra el nodo (id) más profundo que corresponde a un código de cuenta.
    """
    best_node = None
    
    for item in structure:
        # Check patterns in this node
        if "patterns" in item:
            for p in item["patterns"]:
                p_clean = p.replace("%", "")
                if account_code.startswith(p_clean):
                    best_node = item
                    break
        
        # Check children
        if "children" in item:
            child_node = find_pgc_node(account_code, item["children"])
            if child_node:
                return child_node
                
        if best_node:
            return best_node
            
    return None
