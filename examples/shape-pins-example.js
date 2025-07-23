// Example demonstrating ShapeConnectionPin usage in libavoid-js
import { AvoidLib } from "../dist/index.js";

async function main() {
  // Initialize Avoid module
  await AvoidLib.load("../dist/libavoid.wasm");
  const Avoid = AvoidLib.getInstance();

  // Create router with orthogonal routing
  const router = new Avoid.Router(Avoid.OrthogonalRouting);

  // Create first shape (rectangle)
  const shape1Poly = new Avoid.Rectangle(
    new Avoid.Point(50, 50),   // center
    100, 60                     // width, height
  );
  const shape1 = new Avoid.ShapeRef(router, shape1Poly);
  
  // Create second shape
  const shape2Poly = new Avoid.Rectangle(
    new Avoid.Point(250, 200),  // center
    100, 60                      // width, height
  );
  const shape2 = new Avoid.ShapeRef(router, shape2Poly);

  // Create connection pins on the shapes
  // Pin class IDs - you can define your own constants
  const INPUT_PIN = 1;
  const OUTPUT_PIN = 2;
  const CENTER_PIN = 3;

  // Add output pin on right side of shape1 (x=1.0 means rightmost edge)
  const shape1OutputPin = new Avoid.ShapeConnectionPin(
    shape1,
    OUTPUT_PIN,     // classId
    1.0,            // xOffset (0.0 = left, 1.0 = right)
    0.5,            // yOffset (0.0 = top, 1.0 = bottom)
    true,           // proportional (true means offsets are proportions)
    0.0,            // insideOffset (0 means on the edge)
    Avoid.ConnDirRight  // visibility direction
  );

  // Add input pin on left side of shape2
  const shape2InputPin = new Avoid.ShapeConnectionPin(
    shape2,
    INPUT_PIN,      // classId
    0.0,            // xOffset (leftmost edge)
    0.5,            // yOffset (middle)
    true,           // proportional
    0.0,            // insideOffset
    Avoid.ConnDirLeft   // visibility direction
  );

  // Add center pins to both shapes (using the shorter constructor)
  const shape1CenterPin = new Avoid.ShapeConnectionPin(
    shape1,
    CENTER_PIN,
    0.5, 0.5,       // center position
    0.0,            // insideOffset
    Avoid.ConnDirAll // visible from all directions
  );

  const shape2CenterPin = new Avoid.ShapeConnectionPin(
    shape2,
    CENTER_PIN,
    0.5, 0.5,       // center position
    0.0,            // insideOffset
    Avoid.ConnDirAll
  );

  // Create connectors using the pins
  // Note: Since the WebIDL binding doesn't support the ConnEnd(shape, pinClassId) constructor,
  // we need to use the pin positions directly
  
  // Get the actual positions of the pins
  const outputPinPos = shape1OutputPin.position();
  const inputPinPos = shape2InputPin.position();
  
  // Create connector from output pin to input pin
  const conn1 = new Avoid.ConnRef(router);
  conn1.setSourceEndpoint(new Avoid.ConnEnd(outputPinPos));
  conn1.setDestEndpoint(new Avoid.ConnEnd(inputPinPos));

  // Create another connector between center pins
  const center1Pos = shape1CenterPin.position();
  const center2Pos = shape2CenterPin.position();
  
  const conn2 = new Avoid.ConnRef(router);
  conn2.setSourceEndpoint(new Avoid.ConnEnd(center1Pos));
  conn2.setDestEndpoint(new Avoid.ConnEnd(center2Pos));

  // Process initial routing
  router.processTransaction();

  // Display the routes
  console.log("Initial routes:");
  displayRoute("Output to Input", conn1);
  displayRoute("Center to Center", conn2);

  // Move shape1 and see how pins update
  console.log("\nMoving shape1 by (100, 50)...");
  router.moveShape(shape1, 100, 50);
  
  // Update connector endpoints with new pin positions
  conn1.setSourceEndpoint(new Avoid.ConnEnd(shape1OutputPin.position()));
  conn2.setSourceEndpoint(new Avoid.ConnEnd(shape1CenterPin.position()));
  
  router.processTransaction();

  console.log("\nRoutes after moving shape1:");
  displayRoute("Output to Input", conn1);
  displayRoute("Center to Center", conn2);

  // Demonstrate pin properties
  console.log("\nPin properties:");
  console.log("Shape1 output pin:");
  console.log("  Position:", shape1OutputPin.position());
  console.log("  Directions:", shape1OutputPin.directions());
  console.log("  Is exclusive:", shape1OutputPin.isExclusive());

  // Set connection cost for prioritizing certain pins
  shape1OutputPin.setConnectionCost(10.0);  // Higher cost
  shape1CenterPin.setConnectionCost(5.0);   // Lower cost (preferred)

  // Make a pin exclusive (only one connector can attach)
  shape2InputPin.setExclusive(true);
}

function displayRoute(name, connRef) {
  const route = connRef.displayRoute();
  console.log(`${name} route:`);
  for (let i = 0; i < route.size(); i++) {
    const pt = route.get_ps(i);
    console.log(`  (${pt.x}, ${pt.y})`);
  }
}

main().catch(console.error);