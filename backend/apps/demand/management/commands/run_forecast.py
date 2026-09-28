"""
Management command to run the XGBoost forecasting pipeline, audit datasets, inspect metrics, or backfill actuals.
"""
from django.core.management.base import BaseCommand
from ml.forecasting.forecast_service import (
    run_pipeline,
    run_data_validation,
    run_model_evaluation,
    backfill_actuals
)

class Command(BaseCommand):
    help = 'Executes the BloodChain ML demand forecasting pipeline or audits'

    def add_arguments(self, parser):
        parser.add_argument('--facility', type=str, help='Target facility ID (e.g. ch_h_01, ma_b_01)')
        parser.add_argument('--validate', action='store_true', help='Validate dataset continuity and hygiene')
        parser.add_argument('--status', action='store_true', help='Display model training history and validation metrics')
        parser.add_argument('--backfill', action='store_true', help='Backfill actual units for expired forecast dates')

    def handle(self, *args, **options):
        if options['validate']:
            self.stdout.write(self.style.NOTICE("Running data validation audit..."))
            report = run_data_validation(facility_id=options.get('facility'))
            self.stdout.write(self.style.SUCCESS(f"Audit completed: {report}"))
            return

        if options['status']:
            self.stdout.write(self.style.NOTICE("Fetching model metadata and metrics..."))
            metadata_list = run_model_evaluation()
            for meta in metadata_list:
                self.stdout.write(f"- {meta.model_version} | Series: {meta.total_series_trained} | XGB MAE: {meta.xgb_mae} | Trained: {meta.trained_at}")
            return

        if options['backfill']:
            self.stdout.write(self.style.NOTICE("Backfilling actuals for completed forecast dates..."))
            count = backfill_actuals()
            self.stdout.write(self.style.SUCCESS(f"Backfilled {count} predictions with actual operational outcomes."))
            return

        facility_id = options.get('facility')
        self.stdout.write(self.style.NOTICE(f"Launching XGBoost pipeline for facility: {facility_id or 'ALL'}..."))
        result = run_pipeline(facility_id=facility_id)
        self.stdout.write(self.style.SUCCESS(f"Pipeline finished: {result}"))
