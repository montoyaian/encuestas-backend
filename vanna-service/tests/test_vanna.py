from training_data import DDL_STATEMENTS, DOCUMENTATION, QUESTION_SQL_PAIRS


def test_training_data_counts():
    assert len(DDL_STATEMENTS) > 0
    assert len(DOCUMENTATION) > 0
    assert len(QUESTION_SQL_PAIRS) > 0
