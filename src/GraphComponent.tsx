import { Component } from 'react';
import ForceGraph3D, { GraphData } from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import React from 'react';
import { Neuron } from './App';
import './GraphComponent.css';
import { SEMANTIC_COLORS } from './constants';

type GraphProps = {
    graph: GraphData;
    neurons: Map<string, Neuron>;
};

type GraphState = {
    graph: GraphData;
    neurons: Map<string, Neuron>;
};

class GraphComponent extends Component<GraphProps, GraphState> {
    private fgRef: any;

    constructor(props) {
        super(props);
        this.state = {
            graph: props.graph,
            neurons: props.neurons,
        };
        this.fgRef = React.createRef();
    }

    componentDidMount() {
        if (this.fgRef.current) {
            const camera = this.fgRef.current.camera();
            const radius = 300; // Todo: make this dynamic
            let angle = 0;

            const animate = () => {
                // Rotate camera in a circle around the center
                // control.autoRotate does not work, so we need to manually rotate the camera
                angle += 0.005;
                camera.position.x = radius * Math.cos(angle);
                camera.position.z = radius * Math.sin(angle);
                camera.lookAt(0, 0, 0);

                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    private recentlyFired(nodeId: string): boolean {
        const FIRING_DISPLAY_MS = 400; // How long to show the firing state
        const neuron = this.state.neurons.get(nodeId);
        const timeSinceLastFired = neuron?.lastFired
            ? Date.now() - neuron.lastFired
            : Infinity;
        return timeSinceLastFired < FIRING_DISPLAY_MS;
    }

    render() {
        return (
            <div className='App-graph'>
                <ForceGraph3D
                    ref={this.fgRef}
                    graphData={this.state.graph}
                    autoRotate={true}
                    autoRotateSpeed={1.0}
                    nodeLabel={(node) => {
                        const nodeId = node.id as string;
                        const neuron = this.state.neurons.get(nodeId);
                        return neuron ? neuron.activation.toString() : '';
                    }}
                    nodeColor={(node) => {
                        const nodeId = node.id as string;
                        return this.recentlyFired(nodeId)
                            ? SEMANTIC_COLORS.MODULE_FIRED
                            : SEMANTIC_COLORS.MODULE_TEXT;
                    }}
                    showNavInfo={false}
                    width={240}
                    height={240}
                    backgroundColor={SEMANTIC_COLORS.APP_BG}
                    linkColor={SEMANTIC_COLORS.MODULE_TEXT}
                    linkWidth={1}
                    linkOpacity={0.9}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    enableNavigationControls={true}
                    linkCurvature={0.25}
                    nodeThreeObject={(node) => {
                        const nodeId = node.id as string;
                        const neuron = this.state.neurons.get(nodeId);
                        const sprite = new SpriteText(neuron && nodeId);
                        sprite.color = this.recentlyFired(nodeId)
                            ? SEMANTIC_COLORS.MODULE_FIRED
                            : SEMANTIC_COLORS.MODULE_TEXT;
                        sprite.textHeight = 12;
                        return sprite;
                    }}
                />
            </div>
        );
    }
}

export default GraphComponent;
