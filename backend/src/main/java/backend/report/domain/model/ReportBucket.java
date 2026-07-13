package backend.report.domain.model;

public enum ReportBucket {
    DAY("day"),
    WEEK("week"),
    MONTH("month");

    private final String sqlUnit;

    ReportBucket(String sqlUnit) {
        this.sqlUnit = sqlUnit;
    }

    public String getSqlUnit() {
        return sqlUnit;
    }
}
