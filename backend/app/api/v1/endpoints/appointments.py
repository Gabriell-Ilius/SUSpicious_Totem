from typing import List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, col
from app.db.session import get_session
from app.models.appointment import Appointment, AppointmentRead

router = APIRouter()

@router.get("/search", response_model=AppointmentRead)
def search_appointment(identifier: str, session: Session = Depends(get_session)):
    """
    Busca uma consulta agendada para hoje usando o CPF ou o CNS.
    """
    clean_id = "".join(filter(str.isdigit, identifier))
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    query = select(Appointment).where(
        ((Appointment.cpf == clean_id) | (Appointment.cns == clean_id)),
        Appointment.scheduled_time >= today_start,
        Appointment.scheduled_time <= today_end,
        Appointment.status == "SCHEDULED"
    )
    
    appointment = session.exec(query).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma consulta agendada para hoje foi encontrada com este documento."
        )
        
    return appointment


@router.post("/{appointment_id}/checkin", response_model=AppointmentRead)
def checkin_appointment(appointment_id: int, session: Session = Depends(get_session)):
    """
    Confirma a presença do paciente ao chegar no totem.
    """
    appointment = session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Consulta não encontrada.")
        
    appointment.status = "CONFIRMED"
    session.add(appointment)
    session.commit()
    session.refresh(appointment)
    
    return appointment