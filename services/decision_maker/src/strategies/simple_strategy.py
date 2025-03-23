def simple_moving_average(price, historical_data):
    """Basic SMA strategy (buy if price < avg, sell if price > avg)."""
    avg_price = sum(historical_data) / len(historical_data) if historical_data else price
    if price < avg_price:
        return "BUY"
    elif price > avg_price:
        return "SELL"
    return None
