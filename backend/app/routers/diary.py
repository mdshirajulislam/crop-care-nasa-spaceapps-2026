from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import FarmActivity, Expense, HarvestIncome, Plot, User
from app.services.expense_service import ExpenseService
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/diary", tags=["Farm Diary & Expense Management"])

class ActivityCreate(BaseModel):
    plot_id: Optional[int] = None
    activity_type: str
    date: str
    details: str
    cost: Optional[float] = 0.0
    worker_count: Optional[int] = 0
    photo_url: Optional[str] = None

class ActivityUpdate(BaseModel):
    activity_type: Optional[str] = None
    date: Optional[str] = None
    details: Optional[str] = None
    cost: Optional[float] = None
    worker_count: Optional[int] = None

class ExpenseCreate(BaseModel):
    plot_id: Optional[int] = None
    category: str
    amount: float
    date: str
    description: str

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None

class HarvestCreate(BaseModel):
    plot_id: Optional[int] = None
    crop_yield_kg: float
    total_sale_amount: float
    date: str
    note: Optional[str] = None

class HarvestUpdate(BaseModel):
    crop_yield_kg: Optional[float] = None
    total_sale_amount: Optional[float] = None
    date: Optional[str] = None
    note: Optional[str] = None

# --- Activities ---
@router.get("/activities")
def get_activities(db: Session = Depends(get_db)):
    return db.query(FarmActivity).order_by(FarmActivity.id.desc()).all()

@router.post("/activities")
def create_activity(data: ActivityCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    user_id = user.id if user else 1
    plot = db.query(Plot).first()
    plot_id = data.plot_id or (plot.id if plot else 1)

    act = FarmActivity(
        user_id=user_id,
        plot_id=plot_id,
        activity_type=data.activity_type,
        date=data.date,
        details=data.details,
        cost=data.cost or 0.0,
        worker_count=data.worker_count or 0,
        photo_url=data.photo_url
    )
    db.add(act)

    # If cost > 0, also auto-log into expenses
    if data.cost and data.cost > 0:
        exp = Expense(
            user_id=user_id,
            plot_id=plot_id,
            category=data.activity_type,
            amount=data.cost,
            date=data.date,
            description=f"{data.activity_type}: {data.details}"
        )
        db.add(exp)

    db.commit()
    db.refresh(act)
    return {"status": "success", "activity": act}

@router.put("/activities/{act_id}")
def update_activity(act_id: int, data: ActivityUpdate, db: Session = Depends(get_db)):
    act = db.query(FarmActivity).filter(FarmActivity.id == act_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="কার্যক্রম পাওয়া যায়নি")
    
    if data.activity_type is not None: act.activity_type = data.activity_type
    if data.date is not None: act.date = data.date
    if data.details is not None: act.details = data.details
    if data.cost is not None: act.cost = data.cost
    if data.worker_count is not None: act.worker_count = data.worker_count

    db.commit()
    db.refresh(act)
    return {"status": "success", "activity": act}

@router.delete("/activities/{act_id}")
def delete_activity(act_id: int, db: Session = Depends(get_db)):
    act = db.query(FarmActivity).filter(FarmActivity.id == act_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="কার্যক্রম পাওয়া যায়নি")
    db.delete(act)
    db.commit()
    return {"status": "success", "message": "কার্যক্রম সফলভাবে মুছে ফেলা হয়েছে"}

# --- Expenses ---
@router.get("/expenses")
def get_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.id.desc()).all()

@router.post("/expenses")
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    user_id = user.id if user else 1
    plot = db.query(Plot).first()
    plot_id = data.plot_id or (plot.id if plot else 1)

    exp = Expense(
        user_id=user_id,
        plot_id=plot_id,
        category=data.category,
        amount=data.amount,
        date=data.date,
        description=data.description
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return {"status": "success", "expense": exp}

@router.put("/expenses/{exp_id}")
def update_expense(exp_id: int, data: ExpenseUpdate, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="খরচের রেকর্ড পাওয়া যায়নি")
    
    if data.category is not None: exp.category = data.category
    if data.amount is not None: exp.amount = data.amount
    if data.date is not None: exp.date = data.date
    if data.description is not None: exp.description = data.description

    db.commit()
    db.refresh(exp)
    return {"status": "success", "expense": exp}

@router.delete("/expenses/{exp_id}")
def delete_expense(exp_id: int, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="খরচের রেকর্ড পাওয়া যায়নি")
    db.delete(exp)
    db.commit()
    return {"status": "success", "message": "খরচের রেকর্ড মুছে ফেলা হয়েছে"}

# --- Harvests ---
@router.get("/harvests")
def get_harvests(db: Session = Depends(get_db)):
    return db.query(HarvestIncome).order_by(HarvestIncome.id.desc()).all()

@router.post("/harvests")
def create_harvest(data: HarvestCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    user_id = user.id if user else 1
    plot = db.query(Plot).first()
    plot_id = data.plot_id or (plot.id if plot else 1)

    harvest = HarvestIncome(
        user_id=user_id,
        plot_id=plot_id,
        crop_yield_kg=data.crop_yield_kg,
        total_sale_amount=data.total_sale_amount,
        sale_price_per_kg=round(data.total_sale_amount / max(data.crop_yield_kg, 1), 2),
        date=data.date,
        note=data.note
    )
    db.add(harvest)
    db.commit()
    db.refresh(harvest)
    return {"status": "success", "harvest": harvest}

@router.put("/harvests/{harv_id}")
def update_harvest(harv_id: int, data: HarvestUpdate, db: Session = Depends(get_db)):
    harv = db.query(HarvestIncome).filter(HarvestIncome.id == harv_id).first()
    if not harv:
        raise HTTPException(status_code=404, detail="ফলন ও বিক্রির তথ্য পাওয়া যায়নি")
    
    if data.crop_yield_kg is not None: harv.crop_yield_kg = data.crop_yield_kg
    if data.total_sale_amount is not None: 
        harv.total_sale_amount = data.total_sale_amount
        harv.sale_price_per_kg = round(data.total_sale_amount / max(harv.crop_yield_kg, 1), 2)
    if data.date is not None: harv.date = data.date
    if data.note is not None: harv.note = data.note

    db.commit()
    db.refresh(harv)
    return {"status": "success", "harvest": harv}

@router.delete("/harvests/{harv_id}")
def delete_harvest(harv_id: int, db: Session = Depends(get_db)):
    harv = db.query(HarvestIncome).filter(HarvestIncome.id == harv_id).first()
    if not harv:
        raise HTTPException(status_code=404, detail="ফলন তথ্য পাওয়া যায়নি")
    db.delete(harv)
    db.commit()
    return {"status": "success", "message": "ফলনের তথ্য সফলভাবে মুছে ফেলা হয়েছে"}

@router.get("/financial-summary")
def get_financial_summary(db: Session = Depends(get_db)):
    expenses = db.query(Expense).all()
    harvests = db.query(HarvestIncome).all()
    plots = db.query(Plot).all()
    total_land_bigha = sum(p.area_value for p in plots) if plots else 3.5

    exp_dicts = [{"category": e.category, "amount": e.amount} for e in expenses]
    harv_dicts = [{"crop_yield_kg": h.crop_yield_kg, "total_sale_amount": h.total_sale_amount} for h in harvests]

    summary = ExpenseService.calculate_farm_financials(exp_dicts, harv_dicts, total_land_bigha)
    return summary
