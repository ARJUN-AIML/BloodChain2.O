from django.db import models

class DemandPrediction(models.Model):
    """
    Stores 7-day future ML demand predictions for each facility and product series in Neon PostgreSQL.
    Append-only: preserves prediction history and tracks accuracy when actuals are backfilled.
    """
    facility_id = models.CharField(max_length=50, db_index=True)
    facility_type = models.CharField(max_length=50, default='Hospital')
    forecast_target = models.CharField(max_length=50, default='units_requested')
    blood_group = models.CharField(max_length=10, db_index=True)
    blood_component = models.CharField(max_length=50, db_index=True)
    forecast_date = models.DateField(db_index=True)
    predicted_units = models.FloatField()
    generated_at = models.DateTimeField(auto_now_add=True)
    model_version = models.CharField(max_length=100, db_index=True)
    actual_units = models.FloatField(null=True, blank=True)
    prediction_error = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'demand_predictions'
        ordering = ['forecast_date']
        indexes = [
            models.Index(fields=['facility_id', 'blood_group', 'blood_component', 'forecast_date']),
            models.Index(fields=['facility_id', 'model_version']),
        ]

    def __str__(self):
        return f"{self.facility_id} | {self.blood_group} {self.blood_component} | {self.forecast_date}: {self.predicted_units} units ({self.forecast_target})"


class ModelMetadata(models.Model):
    """
    Stores metadata, chronological validation metrics, and data audit results for each XGBoost training run.
    """
    model_version = models.CharField(max_length=100, unique=True, db_index=True)
    trained_at = models.DateTimeField(auto_now_add=True)
    training_data_start = models.DateField()
    training_data_end = models.DateField()
    validation_data_start = models.DateField(null=True, blank=True)
    validation_data_end = models.DateField(null=True, blank=True)
    total_series_trained = models.IntegerField(default=0)
    total_predictions_generated = models.IntegerField(default=0)
    xgb_mae = models.FloatField(null=True, blank=True)
    xgb_rmse = models.FloatField(null=True, blank=True)
    xgb_wape = models.FloatField(null=True, blank=True)
    baseline_mae = models.FloatField(null=True, blank=True)
    baseline_rmse = models.FloatField(null=True, blank=True)
    baseline_wape = models.FloatField(null=True, blank=True)
    facilities_with_sufficient_data = models.IntegerField(default=0)
    facilities_insufficient_data = models.IntegerField(default=0)
    data_quality_warnings = models.TextField(default='[]')
    config_json = models.TextField(default='{}')

    class Meta:
        db_table = 'model_metadata'
        ordering = ['-trained_at']

    def __str__(self):
        return f"Model {self.model_version} (Trained: {self.trained_at})"
