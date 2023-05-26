import { Component } from 'react';

class Connection extends Component {
    constructor(props) {
        super(props);
        this.tick = this.tick.bind(this);
    }

    tick() {}

    render() {
        let display = ' '.repeat(this.props.connection.length + 1).split('');
        this.props.connection.signals.map(
            (signal) => (display[signal.progress] = '➳')
        );
        display = display.join('');
        return (
            <div className="Connection">
                [{display}] ➤ {this.props.connection.destination} ⟿{' '}
                {this.props.connection.length}
                {/* {this.props.connection.signals && 
                    this.props.connection.signals.map(signal => <span key={signal.key}>{signal.progress} </span>)
                } */}
            </div>
        );
    }
}

export default Connection;
