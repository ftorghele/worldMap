// Config
var appConfig  = {
	// d3
	TRANSLATE_0 : 500,
	TRANSLATE_1 : 0,
	SCALE : 250,
  	// three.js
	WIDTH : window.innerWidth, 
	HEIGHT : window.innerHeight,  
	// three.js Camera
	VIEW_ANGLE : 45, 
	ASPECT : window.innerWidth / window.innerHeight, 
	NEAR : 0.1, 
	FAR : 10000,
	CAMERA_X : 0,
	CAMERA_Y : 2000,
	CAMERA_Z : 200
}
		  
  
var geons = {};
geons.geoConfig = function() {
	this.TRANSLATE_0 = appConfig.TRANSLATE_0;
	this.TRANSLATE_1 = appConfig.TRANSLATE_1;
	this.SCALE = appConfig.SCALE;
	
	this.mercator = d3.geo.equirectangular();
	this.path = d3.geo.path().projection(this.mercator);
	
	this.setupGeo = function() {
		var translate = this.mercator.translate();
		translate[0] = this.TRANSLATE_0;
		translate[1] = this.TRANSLATE_1;
		
		this.mercator.translate(translate);
		this.mercator.scale(this.SCALE);
	}
}

geo = new geons.geoConfig();
geo.setupGeo();


var scene, renderer,
camera, controls, mesh;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


if( !init() )	animate();

// init the scene
function init(){

	if( Detector.webgl ){
		renderer = new THREE.WebGLRenderer({
			antialias		: true,	// to get smoother output
			preserveDrawingBuffer	: true	// to allow screenshot
		});
		renderer.setClearColorHex( 0xBBBBBB, 1 );
	}else{
		renderer	= new THREE.CanvasRenderer();
	}
	
	renderer.setSize( appConfig.WIDTH, appConfig.HEIGHT );
	$("#container").append(renderer.domElement);

	// create a scene
	scene = new THREE.Scene();

	// put a camera in the scene
	camera = new THREE.PerspectiveCamera(appConfig.VIEW_ANGLE, appConfig.ASPECT, 
									   appConfig.NEAR, appConfig.FAR);
	
	// add and position the camera at a fixed position
	scene.add(camera);
	camera.position.x = appConfig.CAMERA_X;
	camera.position.y = appConfig.CAMERA_Y;
	camera.position.z = appConfig.CAMERA_Z;
	camera.lookAt( scene.position );

	// transparently support window resize
	THREEx.WindowResize.bind(renderer, camera);
	
	// add a light at a specific position
	var pointLight = new THREE.PointLight(0xFFFFFF);
	scene.add(pointLight);
	pointLight.position.x = 1500;
	pointLight.position.y = 1500;
	pointLight.position.z = 1500;
	
	// add a base plane on which we'll render our map
	var planeGeo = new THREE.PlaneGeometry(10000, 10000, 10, 10);
	var planeMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
	var plane = new THREE.Mesh(planeGeo, planeMat);
	
	// rotate it to correct position
	plane.rotation.x = -Math.PI/2;
	scene.add(plane);	
	
	addGeoObject();
	
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function onDocumentMouseMove( event ) {

	mouseX = ( event.clientX - windowHalfX );
	mouseY = ( event.clientY - windowHalfY );

}

// animation loop
function animate() {

	// loop on request animation loop
	// - it has to be at the begining of the function
	// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	requestAnimationFrame( animate );

	// do the render
	render();
}

// render the scene
function render() {
	
	camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
	camera.lookAt( scene.position );

	// actually render the scene
	renderer.render( scene, camera );
}

 
// add the loaded gis object (in geojson format) to the map
function addGeoObject() {
	jQuery.getJSON('json/countries.json', function(data, textStatus, jqXHR) {
	
		// keep track of rendered objects
		var meshes = [];
		var i, j;
		// convert to mesh and calculate values
		for (i = 0 ; i < data.features.length ; i++) {
			var geoFeature = data.features[i]
			var feature = geo.path(geoFeature);
			// we only need to convert it to a three.js path
			var mesh = transformSVGPathExposed(feature);
			// add to array
			for (j = 0 ; j < mesh.length ; j++) {
				  meshes.push(mesh[j]);
			}
		}
		
		// we've got our paths now extrude them to a height and add a color
		for (i = 0 ; i < meshes.length ; i++) {
		
			// create material color based on average
			var mathColor = gradient(Math.round(Math.ceil(Math.random() * 255)),255);
			var material = new THREE.MeshLambertMaterial({
				color: mathColor
			});
			
			// create extrude based on total
			var shape3d = meshes[i].extrude({amount: Math.round(10), bevelEnabled: false});
			
			// create a mesh based on material and extruded shape
			var toAdd = new THREE.Mesh(shape3d, material);
			
			// rotate and position the elements nicely in the center
			toAdd.rotation.x = Math.PI/2;
			toAdd.translateX(-490);
			toAdd.translateZ(50);
			toAdd.translateY(10/2);
			
			// add to scene
			scene.add(toAdd);
			console.log("added");
		}
	});
}
  
// simple gradient function
function gradient(length, maxLength) {

	var i = (length * 255 / maxLength);
	var r = i;
	var g = 255-(i);
	var b = 0;
	
	var rgb = b | (g << 8) | (r << 16);
	return rgb;
}