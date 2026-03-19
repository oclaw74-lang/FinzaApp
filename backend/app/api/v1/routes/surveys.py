import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, get_raw_token
from app.core.supabase_client import get_user_client
from app.schemas.survey import SurveySubmission, SurveyResponse

router = APIRouter(prefix="/surveys", tags=["surveys"])


def send_survey_email(data: SurveySubmission) -> None:
    """Send survey notification email if SMTP is configured."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    notify_email = os.getenv("SURVEY_NOTIFY_EMAIL")

    if not all([smtp_host, smtp_user, smtp_pass, notify_email]):
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = notify_email
        msg["Subject"] = f"Nueva encuesta Finza - Rating: {data.usaria_app}/5"

        body = f"""
Nueva respuesta de encuesta Finza:

Usaria la app: {data.usaria_app}/5
Precio mensual: {data.precio_mensual or 'No respondio'}
Que mejorar: {data.que_mejorar or 'No respondio'}
Que agregar: {data.que_agregar or 'No respondio'}
Experiencia general: {data.experiencia_general or 'No respondio'}/5
Comentario: {data.comentario or 'No respondio'}
Email contacto: {data.email_contacto or 'No proporcionado'}
        """

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", "587"))) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception:
        pass  # Don't fail the request if email fails


@router.post("", response_model=SurveyResponse)
async def submit_survey(
    body: SurveySubmission,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> SurveyResponse:
    """Submit a survey response. Stores in DB and optionally sends email."""
    client = get_user_client(token)

    try:
        result = (
            client.table("survey_responses")
            .insert(
                {
                    "user_id": current_user["user_id"],
                    "usaria_app": body.usaria_app,
                    "precio_mensual": body.precio_mensual,
                    "que_mejorar": body.que_mejorar,
                    "que_agregar": body.que_agregar,
                    "experiencia_general": body.experiencia_general,
                    "comentario": body.comentario,
                    "email_contacto": body.email_contacto,
                }
            )
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Error al guardar encuesta.")

    send_survey_email(body)

    return SurveyResponse(
        id=result.data[0]["id"],
        message="Gracias por tu opinion!",
    )
