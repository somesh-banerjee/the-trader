from src.strategies.simple_strategy import simple_moving_average

def make_decision(symbol, price, historical_data):
    """Apply trading strategy to make a buy/sell decision."""
    signal = simple_moving_average(price, historical_data)
    return signal
