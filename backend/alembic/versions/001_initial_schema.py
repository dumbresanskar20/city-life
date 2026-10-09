"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-09 11:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        try:
            op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        except Exception as e:
            print(f"[Warning] PostGIS extension could not be enabled: {e}")

    # places table
    op.create_table(
        "places",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("osm_id", sa.String(length=64), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("subcategory", sa.String(length=64), nullable=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("price_level", sa.Integer(), server_default="2", nullable=False),
        sa.Column("rating", sa.Float(), server_default="4.0", nullable=False),
        sa.Column("rating_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("opening_hours", sa.JSON(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("accessibility", sa.JSON(), nullable=True),
        sa.Column("cleanliness_score", sa.Float(), server_default="70.0", nullable=False),
        sa.Column("safety_score", sa.Float(), server_default="75.0", nullable=False),
        sa.Column("affordability_score", sa.Float(), server_default="65.0", nullable=False),
        sa.Column("accessibility_score", sa.Float(), server_default="70.0", nullable=False),
        sa.Column("overall_score", sa.Float(), server_default="72.0", nullable=False),
        sa.Column("photo_url", sa.String(length=500), nullable=True),
        sa.Column("source", sa.String(length=64), server_default="osm", nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_places_osm_id", "places", ["osm_id"])
    op.create_index("ix_places_name", "places", ["name"])
    op.create_index("ix_places_category", "places", ["category"])
    op.create_index("ix_places_lat", "places", ["lat"])
    op.create_index("ix_places_lng", "places", ["lng"])
    op.create_index("idx_places_lat_lng", "places", ["lat", "lng"])
    op.create_index("idx_places_category_rating", "places", ["category", "rating"])

    # heritage_sites table
    op.create_table(
        "heritage_sites",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("place_id", sa.Integer(), sa.ForeignKey("places.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("era", sa.String(length=100), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("significance", sa.Text(), nullable=False),
        sa.Column("visiting_hours", sa.String(length=100), server_default="09:00 - 18:00", nullable=False),
        sa.Column("entry_fee", sa.String(length=100), server_default="₹25 (Domestic) / ₹300 (Foreign)", nullable=False),
        sa.Column("traditions", sa.JSON(), nullable=True),
        sa.Column("wikidata_id", sa.String(length=32), nullable=True),
        sa.Column("story_cache", sa.Text(), nullable=True),
    )
    op.create_index("ix_heritage_sites_place_id", "heritage_sites", ["place_id"])

    # reports table
    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_session_id", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("photo_path", sa.String(length=500), nullable=True),
        sa.Column("audio_path", sa.String(length=500), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("detected_category", sa.String(length=64), nullable=True),
        sa.Column("sentiment", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("severity", sa.Integer(), server_default="3", nullable=False),
        sa.Column("credibility_score", sa.Float(), server_default="50.0", nullable=False),
        sa.Column("verification_status", sa.String(length=32), server_default="unverified", nullable=False),
        sa.Column("reasons", sa.JSON(), nullable=True),
        sa.Column("duplicate_of", sa.Integer(), sa.ForeignKey("reports.id", ondelete="SET NULL"), nullable=True),
        sa.Column("upvotes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("downvotes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_synthetic", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_reports_user_session_id", "reports", ["user_session_id"])
    op.create_index("ix_reports_category", "reports", ["category"])
    op.create_index("ix_reports_verification_status", "reports", ["verification_status"])
    op.create_index("ix_reports_lat", "reports", ["lat"])
    op.create_index("ix_reports_lng", "reports", ["lng"])
    op.create_index("ix_reports_created_at", "reports", ["created_at"])
    op.create_index("idx_reports_lat_lng", "reports", ["lat", "lng"])
    op.create_index("idx_reports_category_status", "reports", ["category", "verification_status"])
    op.create_index("idx_reports_created_status", "reports", ["created_at", "verification_status"])

    # report_votes table
    op.create_table(
        "report_votes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("report_id", sa.Integer(), sa.ForeignKey("reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_id", sa.String(length=128), nullable=False),
        sa.Column("value", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("report_id", "session_id", name="uq_report_session_vote"),
    )
    op.create_index("ix_report_votes_report_id", "report_votes", ["report_id"])
    op.create_index("ix_report_votes_session_id", "report_votes", ["session_id"])

    # incidents table
    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source", sa.String(length=32), server_default="synthetic", nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("severity", sa.Integer(), server_default="3", nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("weight", sa.Float(), server_default="1.0", nullable=False),
        sa.Column("report_id", sa.Integer(), sa.ForeignKey("reports.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_synthetic", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.create_index("ix_incidents_category", "incidents", ["category"])
    op.create_index("ix_incidents_lat", "incidents", ["lat"])
    op.create_index("ix_incidents_lng", "incidents", ["lng"])
    op.create_index("ix_incidents_occurred_at", "incidents", ["occurred_at"])
    op.create_index("idx_incidents_lat_lng", "incidents", ["lat", "lng"])
    op.create_index("idx_incidents_time_cat", "incidents", ["occurred_at", "category"])

    # hotspots table
    op.create_table(
        "hotspots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("centroid_lat", sa.Float(), nullable=False),
        sa.Column("centroid_lng", sa.Float(), nullable=False),
        sa.Column("radius_m", sa.Float(), server_default="150.0", nullable=False),
        sa.Column("risk_score", sa.Float(), nullable=False),
        sa.Column("incident_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("time_bucket", sa.String(length=32), nullable=False),
        sa.Column("computed_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_hotspots_time_bucket", "hotspots", ["time_bucket"])
    op.create_index("idx_hotspots_bucket_risk", "hotspots", ["time_bucket", "risk_score"])

    # road_segments table
    op.create_table(
        "road_segments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("osm_id", sa.String(length=64), nullable=True),
        sa.Column("geometry", sa.JSON(), nullable=False),
        sa.Column("has_lighting", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("highway_type", sa.String(length=64), server_default="residential", nullable=False),
        sa.Column("nearby_open_places", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_index("ix_road_segments_osm_id", "road_segments", ["osm_id"])

    # route_cache table
    op.create_table(
        "route_cache",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("response", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_route_cache_hash", "route_cache", ["hash"])

    # weather_cache table
    op.create_table(
        "weather_cache",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("city_name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_weather_cache_city_name", "weather_cache", ["city_name"])

    # llm_cache table
    op.create_table(
        "llm_cache",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("prompt_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("response", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_llm_cache_prompt_hash", "llm_cache", ["prompt_hash"])


def downgrade() -> None:
    op.drop_table("llm_cache")
    op.drop_table("weather_cache")
    op.drop_table("route_cache")
    op.drop_table("road_segments")
    op.drop_table("hotspots")
    op.drop_table("incidents")
    op.drop_table("report_votes")
    op.drop_table("reports")
    op.drop_table("heritage_sites")
    op.drop_table("places")
