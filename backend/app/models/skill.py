import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SkillLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class SkillCategory(str, enum.Enum):
    programming = "programming"
    framework = "framework"
    database = "database"
    devops = "devops"
    soft_skill = "soft_skill"
    language = "language"
    other = "other"


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    category = Column(Enum(SkillCategory, name="skill_category"), nullable=False, default=SkillCategory.other)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    candidates = relationship("CandidateSkill", back_populates="skill")
    departments = relationship("DepartmentSkill", back_populates="skill")

    def __repr__(self) -> str:
        return f"<Skill id={self.id} name={self.name}>"


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    level = Column(Enum(SkillLevel, name="skill_level"), nullable=False, default=SkillLevel.beginner)

    # Relationships
    candidate = relationship("Candidate", back_populates="skills")
    skill = relationship("Skill", back_populates="candidates")

    @property
    def id(self):
        return self.skill_id

    @property
    def name(self):
        return self.skill.name if self.skill else ""
