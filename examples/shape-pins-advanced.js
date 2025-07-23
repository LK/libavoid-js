// Advanced example showing a wrapper for shape pin connections
import { AvoidLib } from "../dist/index.js";

// Helper class to manage shape pins and connections
class ShapePinManager {
  constructor(avoid) {
    this.Avoid = avoid;
    this.pins = new Map(); // Map of shape -> Map of classId -> pin
  }

  // Add a pin to a shape
  addPin(shape, classId, xOffset, yOffset, visDirs = null, options = {}) {
    const {
      proportional = true,
      insideOffset = 0.0,
      exclusive = false,
      connectionCost = 0.0
    } = options;

    visDirs = visDirs || this.Avoid.ConnDirAll;

    const pin = new this.Avoid.ShapeConnectionPin(
      shape,
      classId,
      xOffset,
      yOffset,
      proportional,
      insideOffset,
      visDirs
    );

    if (exclusive) {
      pin.setExclusive(true);
    }
    
    if (connectionCost > 0) {
      pin.setConnectionCost(connectionCost);
    }

    // Store the pin
    if (!this.pins.has(shape)) {
      this.pins.set(shape, new Map());
    }
    this.pins.get(shape).set(classId, pin);

    return pin;
  }

  // Get a pin by shape and classId
  getPin(shape, classId) {
    return this.pins.get(shape)?.get(classId);
  }

  // Create a ConnEnd for a shape pin
  createConnEnd(shape, classId) {
    const pin = this.getPin(shape, classId);
    if (!pin) {
      throw new Error(`Pin with classId ${classId} not found on shape`);
    }
    return new this.Avoid.ConnEnd(pin.position());
  }

  // Connect two shape pins
  connectPins(router, shape1, classId1, shape2, classId2) {
    const connRef = new this.Avoid.ConnRef(router);
    connRef.setSourceEndpoint(this.createConnEnd(shape1, classId1));
    connRef.setDestEndpoint(this.createConnEnd(shape2, classId2));
    
    // Store pin info for updates
    connRef._pinInfo = {
      source: { shape: shape1, classId: classId1 },
      dest: { shape: shape2, classId: classId2 }
    };
    
    return connRef;
  }

  // Update all connections after shape movement
  updateConnections(connRefs, router) {
    for (const connRef of connRefs) {
      if (connRef._pinInfo) {
        const { source, dest } = connRef._pinInfo;
        connRef.setSourceEndpoint(this.createConnEnd(source.shape, source.classId));
        connRef.setDestEndpoint(this.createConnEnd(dest.shape, dest.classId));
      }
    }
    router.processTransaction();
  }
}

// Pin class ID constants
const PIN_CLASSES = {
  TOP: 1,
  RIGHT: 2,
  BOTTOM: 3,
  LEFT: 4,
  CENTER: 5,
  TOP_LEFT: 6,
  TOP_RIGHT: 7,
  BOTTOM_LEFT: 8,
  BOTTOM_RIGHT: 9,
  // Custom pins for specific use cases
  INPUT: 10,
  OUTPUT: 11,
  POWER: 12,
  GROUND: 13
};

async function main() {
  await AvoidLib.load("../dist/libavoid.wasm");
  const Avoid = AvoidLib.getInstance();

  const router = new Avoid.Router(Avoid.OrthogonalRouting);
  const pinManager = new ShapePinManager(Avoid);

  // Create shapes representing circuit components
  const component1 = createComponent(Avoid, router, pinManager, 100, 100, "Processor");
  const component2 = createComponent(Avoid, router, pinManager, 300, 100, "Memory");
  const component3 = createComponent(Avoid, router, pinManager, 200, 250, "Power Supply");

  // Create connections between components
  const connections = [];
  
  // Connect processor output to memory input
  connections.push(
    pinManager.connectPins(router, component1, PIN_CLASSES.OUTPUT, component2, PIN_CLASSES.INPUT)
  );
  
  // Connect power supply to both components
  connections.push(
    pinManager.connectPins(router, component3, PIN_CLASSES.POWER, component1, PIN_CLASSES.BOTTOM)
  );
  connections.push(
    pinManager.connectPins(router, component3, PIN_CLASSES.POWER, component2, PIN_CLASSES.BOTTOM)
  );

  // Initial routing
  router.processTransaction();
  displayConnections(connections);

  // Simulate component movement
  console.log("\nMoving processor component...");
  router.moveShape(component1, 50, 100);
  pinManager.updateConnections(connections, router);
  displayConnections(connections);

  // Demonstrate dynamic pin updates
  console.log("\nUpdating power pin position...");
  const powerPin = pinManager.getPin(component3, PIN_CLASSES.POWER);
  powerPin.updatePosition(new Avoid.Point(200, 220)); // Move pin up slightly
  pinManager.updateConnections(connections, router);
  displayConnections(connections);
}

function createComponent(Avoid, router, pinManager, x, y, name) {
  console.log(`\nCreating ${name} at (${x}, ${y})`);
  
  // Create rectangular shape
  const poly = new Avoid.Rectangle(
    new Avoid.Point(x, y),
    80, 60
  );
  const shape = new Avoid.ShapeRef(router, poly);

  // Add standard pins on all sides
  pinManager.addPin(shape, PIN_CLASSES.TOP, 0.5, 0.0, Avoid.ConnDirUp);
  pinManager.addPin(shape, PIN_CLASSES.RIGHT, 1.0, 0.5, Avoid.ConnDirRight);
  pinManager.addPin(shape, PIN_CLASSES.BOTTOM, 0.5, 1.0, Avoid.ConnDirDown);
  pinManager.addPin(shape, PIN_CLASSES.LEFT, 0.0, 0.5, Avoid.ConnDirLeft);
  pinManager.addPin(shape, PIN_CLASSES.CENTER, 0.5, 0.5, Avoid.ConnDirAll);

  // Add corner pins
  pinManager.addPin(shape, PIN_CLASSES.TOP_LEFT, 0.0, 0.0, Avoid.ConnDirUp | Avoid.ConnDirLeft);
  pinManager.addPin(shape, PIN_CLASSES.TOP_RIGHT, 1.0, 0.0, Avoid.ConnDirUp | Avoid.ConnDirRight);
  pinManager.addPin(shape, PIN_CLASSES.BOTTOM_LEFT, 0.0, 1.0, Avoid.ConnDirDown | Avoid.ConnDirLeft);
  pinManager.addPin(shape, PIN_CLASSES.BOTTOM_RIGHT, 1.0, 1.0, Avoid.ConnDirDown | Avoid.ConnDirRight);

  // Add specialized pins based on component type
  if (name === "Processor") {
    // Multiple output pins on the right
    pinManager.addPin(shape, PIN_CLASSES.OUTPUT, 1.0, 0.3, Avoid.ConnDirRight, { connectionCost: 5.0 });
    pinManager.addPin(shape, PIN_CLASSES.OUTPUT, 1.0, 0.7, Avoid.ConnDirRight, { connectionCost: 5.0 });
  } else if (name === "Memory") {
    // Input pins on the left
    pinManager.addPin(shape, PIN_CLASSES.INPUT, 0.0, 0.3, Avoid.ConnDirLeft, { exclusive: true });
    pinManager.addPin(shape, PIN_CLASSES.INPUT, 0.0, 0.7, Avoid.ConnDirLeft, { exclusive: true });
  } else if (name === "Power Supply") {
    // Power output on top
    pinManager.addPin(shape, PIN_CLASSES.POWER, 0.5, 0.0, Avoid.ConnDirUp, { connectionCost: 1.0 });
    // Ground on bottom
    pinManager.addPin(shape, PIN_CLASSES.GROUND, 0.5, 1.0, Avoid.ConnDirDown);
  }

  return shape;
}

function displayConnections(connections) {
  console.log("\nCurrent connection routes:");
  connections.forEach((conn, idx) => {
    const route = conn.displayRoute();
    console.log(`Connection ${idx + 1}:`);
    for (let i = 0; i < route.size(); i++) {
      const pt = route.get_ps(i);
      console.log(`  (${pt.x}, ${pt.y})`);
    }
  });
}

main().catch(console.error);