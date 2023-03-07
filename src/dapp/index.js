
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

const truncateAddress = (address) => `${address.slice(0, 4)}...${address.slice(-4)}`;
const getStatusCellId = (flight) => `status-${flight.flightNumber}-${flight.departure.getTime()}`;
const getFlightDisplayName = (flight) => `${flight.flightNumber} (${flight.departure.toLocaleString()})`;

function display(info) {
  const displayDiv = DOM.elid('display-wrapper');
  displayDiv.prepend(DOM.p(info));
}

(async () => {
  let contract = new Contract('localhost', () => {

    contract.isOperational()
      .then((result) => display(`Contract is operational: ${result}.`))
      .catch(console.warn);

    const flights = [
      {
        airline: 'Turkish Airlines',
        airlineAddress: contract.airlines[0],
        flightNumber: 'TK1234',
        departure: new Date(),
        status: 'unknown'
      },
      {
        airline: 'Turkish Airlines',
        airlineAddress: contract.airlines[1],
        flightNumber: 'TK9999',
        departure: new Date(),
        status: 'unknown'
      },
      {
        airline: 'Turkish Airlines',
        airlineAddress: contract.airlines[2],
        flightNumber: 'TK2023',
        departure: new Date(),
        status: 'unknown'
      }
    ];

    let selectedFlight = null;

    contract.onFlightStatusInfo((error, event) => {
      if (error) {
        console.warn(error);
        return;
      }
      const flight = flights.find((flight) =>
        flight.flightNumber === event.returnValues.flight
        && flight.departure.getTime().toString().startsWith(event.returnValues.timestamp)
      );
      if (flight) {
        flight.status = event.returnValues.status;
        DOM.elid(getStatusCellId(flight)).textContent = flight.status;
      }
    });


    flights.forEach((flight) => {
      const flightRadioInput = DOM.input({ type: 'radio', name: 'flight-radio-input' });
      const tr = DOM.tr()
      tr.addEventListener('click', () => {
        flightRadioInput.checked = true
        selectedFlight = flight;
        DOM.elid('selected-flight-text').textContent = getFlightDisplayName(flight);
      });
      tr.appendChild(DOM.td(flightRadioInput));
      tr.appendChild(DOM.td(flight.airline));
      tr.appendChild(DOM.td(truncateAddress(flight.airlineAddress)));
      tr.appendChild(DOM.td(flight.flightNumber));
      tr.appendChild(DOM.td(flight.departure.toLocaleString()));
      tr.appendChild(DOM.td({ id: getStatusCellId(flight) }, flight.status));
      DOM.elid('flights-table').appendChild(tr);
    });

    DOM.elid('amount').value = 0.5;

    DOM.elid('purchase-insurance-btn').addEventListener('click', () => {
      if (!selectedFlight) return;
      const amount = DOM.elid('amount').value;
      contract.buy(selectedFlight.airlineAddress, selectedFlight.flightNumber, selectedFlight.departure, amount)
        .then(() => display(`Successfuly purchased insurance for flight ${getFlightDisplayName(selectedFlight)}.`))
        .catch(error => console.warn(error, selectedFlight));
    });

    DOM.elid('submit-to-oracles-btn').addEventListener('click', () => {
      if (!selectedFlight) return;
      contract.fetchFlightStatus(selectedFlight.airlineAddress, selectedFlight.flightNumber, selectedFlight.departure)
        .then(() => display(`Successfuly submitted to oracles ${getFlightDisplayName(selectedFlight)}.`))
        .catch((error) => console.warn(error, selectedFlight));
    });

    DOM.elid('payout-credit-btn').addEventListener('click', () => {
      if (!selectedFlight) return;
      contract.pay()
        .then(() => display(`Successfuly payed out credits.`))
        .then(() => contract.getBalance())
        .then((balance) => display(`Balance: ${balance}`))
        .catch(console.warn);
    });

  });

})();
