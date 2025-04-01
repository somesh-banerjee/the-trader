const fs = require('fs');

const getCorrectSegment = (segment) => {
  if (segment.endsWith('EQ')) return 'EQ';
  if (segment.endsWith('FO')) return 'FO';
  if (segment.endsWith('COM')) return 'COM';
  if (segment.endsWith('INDEX')) return 'INDEX';
};

/**
 * * This script reads a JSON file containing instrument data and sends it to a server.
 * * It uses the fetch API to make HTTP POST requests to the server.
 */
fs.readFile('NSE.json', 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading JSON file:', err);
    return;
  }

  // Parse JSON
  const jsonData = JSON.parse(data);
  const apiUrl = 'http://localhost:3000/instruments';

  for (let i = 0; i < jsonData.length; i++) {
    const instrument = jsonData[i];

    // if(!instrument.asset_symbol) break;
    console.log('Processing instrument:', instrument);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exchange: instrument.exchange,
        symbol:
          instrument.asset_symbol ??
          instrument.trading_symbol ??
          instrument.symbol,
        name: instrument.name ?? instrument.short_name,
        short_name: instrument.short_name ?? instrument.name,
        isin: instrument.isin ?? instrument.exchange_token,
        segment: getCorrectSegment(instrument.segment),
        trade_enabled: false,
        upstox_key: instrument.instrument_key,
      }),
    };

    console.log('Sending data to server:', options.body);

    await fetch(apiUrl, options)
      .then((response) => response.json())
      .then((data) => {
        console.log('Response from server:', data);
      })
      .catch((error) => {
        console.error('Error sending data to server:', error);
        return;
      });
  }

  console.log(
    'All data sent to server successfully.' + jsonData.length + ' instruments',
  );
});
