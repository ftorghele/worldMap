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
	CAMERA_Y : 1000,
	CAMERA_Z : 200
}
		  
  
var geons = {};
var scene;
var renderer;
var camera;
		  
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
  
// geoConfig contains the configuration for the geo functions
geo = new geons.geoConfig();
geo.setupGeo();
//var translate = geo.mercator.translate();
jQuery.getJSON('json/countries.json', function(data, textStatus, jqXHR) {
initScene();
addGeoObject();
renderer.render( scene, camera );

function initScene() {
	
	// create a WebGL renderer, camera, and a scene
	renderer = new THREE.WebGLRenderer({antialias:true});
	camera = new THREE.PerspectiveCamera(appConfig.VIEW_ANGLE, appConfig.ASPECT, 
									   appConfig.NEAR, appConfig.FAR);
	scene = new THREE.Scene();
	
	// add and position the camera at a fixed position
	scene.add(camera);
	camera.position.x = appConfig.CAMERA_X;
	camera.position.y = appConfig.CAMERA_Y;
	camera.position.z = appConfig.CAMERA_Z;
	camera.lookAt( scene.position );
	
	// start the renderer, and black background
	renderer.setSize(appConfig.WIDTH, appConfig.HEIGHT);
	renderer.setClearColor(0x000);
	
	// add the render target to the page
	$("#container").append(renderer.domElement);
	
	// add a light at a specific position
	var pointLight = new THREE.PointLight(0xFFFFFF);
	scene.add(pointLight);
	pointLight.position.x = 1500;
	pointLight.position.y = 1500;
	pointLight.position.z = 1500;
	
	// add a base plane on which we'll render our map
	var planeGeo = new THREE.PlaneGeometry(10000, 10000, 10, 10);
	var planeMat = new THREE.MeshLambertMaterial({color: 0x666699});
	var plane = new THREE.Mesh(planeGeo, planeMat);
	
	// rotate it to correct position
	plane.rotation.x = -Math.PI/2;
	scene.add(plane);	
}
  
// add the loaded gis object (in geojson format) to the map
function addGeoObject() {
	
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

});