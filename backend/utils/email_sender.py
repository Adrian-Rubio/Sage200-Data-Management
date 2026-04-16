import smtplib
import os
from email.message import EmailMessage
from datetime import datetime
import io

def send_excel_report_email(to_email: str, excel_bytes: io.BytesIO, filename: str, report_name: str = "Análisis ABC"):
    """
    Sends an email with an Excel file attached.
    Reads SMTP configuration from environment variables.
    """
    smtp_server = os.environ.get("SMTP_SERVER", "")
    smtp_port = os.environ.get("SMTP_PORT", "587")
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    smtp_from = os.environ.get("SMTP_FROM", smtp_user)

    if not smtp_server or not smtp_user or not smtp_password:
        raise Exception("Falta configurar los parámetros SMTP (SMTP_SERVER, SMTP_USER, SMTP_PASSWORD) en el servidor.")

    msg = EmailMessage()
    msg['Subject'] = f'[{report_name}] Reporte Generado - {datetime.now().strftime("%d/%m/%Y")}'
    msg['From'] = smtp_from
    msg['To'] = to_email

    msg.set_content(
        f"Hola,\n\n"
        f"Adjunto encontrarás el reporte de '{report_name}' que has solicitado desde el dashboard.\n\n"
        f"Un saludo,\nEquipo de Data Management"
    )

    # Attach the Excel file
    excel_bytes.seek(0)
    msg.add_attachment(
        excel_bytes.read(),
        maintype='application',
        subtype='vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=filename
    )

    # Convert port to int
    port = int(smtp_port)

    # Try sending via TLS (port 587 usually)
    try:
        if port == 465:
            # SSL
            with smtplib.SMTP_SSL(smtp_server, port) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            # TLS
            with smtplib.SMTP(smtp_server, port) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
    except Exception as e:
        raise Exception(f"No se pudo conectar o enviar el correo por SMTP: {str(e)}")
