from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, declarative_column, declarative_base

class User(db.Model): 
    id: Mapped[int] = mapped_column(int, primary_key=True)
    username: mapped[str] = mapped_column(str, unique=True)
    email: mapped[str]
    password: mapped[str]

db = SQLAlchemy(model_class=User)

