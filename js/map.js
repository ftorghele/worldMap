$(function(){
	
	var worldMap;
	
	function Map() {

		this.TRANSLATE_0 = 500;
		this.TRANSLATE_1 = 0;
		this.SCALE       = 200;
		
		this.WIDTH       = window.innerWidth; 
		this.HEIGHT      = window.innerHeight;  
		
		this.VIEW_ANGLE  = 45;
		this.NEAR        = 0.1; 
		this.FAR         = 10000;
		this.CAMERA_X    = 0;
		this.CAMERA_Y    = 1000;
		this.CAMERA_Z    = 500;
		this.CAMERA_LX   = 0;
		this.CAMERA_LY   = 0;
		this.CAMERA_LZ   = 0;
		
		this.geo;
		this.scene = {};
		this.renderer = {};
		this.camera = {};
		this.stage = {};
	}
	
	Map.prototype = {
		
		init_d3: function() {
			var geons = {};
		
			geons.geoConfig = function() {
				this.TRANSLATE_0 = 500;
				this.TRANSLATE_1 = 0;
				this.SCALE = 200;
				
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
	
			this.geo = new geons.geoConfig();
			this.geo.setupGeo();
		},
		
		init_tree: function() {
			
			if( Detector.webgl ){
				this.renderer = new THREE.WebGLRenderer({
					antialias : true
				});
				this.renderer.setClearColorHex( 0xBBBBBB, 1 );
			}else{
				this.renderer = new THREE.CanvasRenderer();
			}
			
			this.renderer.setSize( this.WIDTH, this.HEIGHT );
			
			// append renderer to dom element
			$("#worldmap").append(this.renderer.domElement);
			
			// create a scene
			this.scene = new THREE.Scene();
			
			// put a camera in the scene
			this.camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.WIDTH / this.HEIGHT, this.NEAR, this.FAR);
			this.camera.position.x = this.CAMERA_X;
			this.camera.position.y = this.CAMERA_Y;
			this.camera.position.z = this.CAMERA_Z;
			this.camera.lookAt( { x: this.CAMERA_LX, y: 0, z: this.CAMERA_LZ} );
			this.scene.add(this.camera);
			
			// transparently support window resize
			THREEx.WindowResize.bind(this.renderer, this.camera);
		},
		
		
		add_light: function() {
			var pointLight = new THREE.PointLight(0xFFFFFF);
			pointLight.position.x = 1000;
			pointLight.position.y = 3000;
			pointLight.position.z = -1000;
			pointLight.intensity = 1.0;
			this.scene.add(pointLight);
		},
		
		add_plain: function() {
			// add a base plane on which we'll render our map
			var planeGeo = new THREE.CubeGeometry(1400, 700, 30);
			var planeMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
			var plane = new THREE.Mesh(planeGeo, planeMat);
			
			// rotate it to correct position
			plane.rotation.x = -Math.PI/2;
			this.scene.add(plane);
		},
		
		add_countries: function(data) {

				var countries = [];
				var i, j;
				
				// convert to threejs meshes
				for (i = 0 ; i < data.features.length ; i++) {
					var geoFeature = data.features[i];
					var properties = geoFeature.properties;
					var feature = this.geo.path(geoFeature);
					
					// we only need to convert it to a three.js path
					var mesh = transformSVGPathExposed(feature);
					
					// add to array
					for (j = 0 ; j < mesh.length ; j++) {
						  countries.push({"data": properties, "mesh": mesh[j]});
					}
				}
				
				var countryColors = { 	"0": 0xffcfcf,
										"1": 0xfeadad,  
										"2": 0xfe8e8e, 
										"3": 0xfd6b6b, 
										"4": 0xff0000 } 
				
				// extrude paths and add color
				for (i = 0 ; i < countries.length ; i++) {
		
					// create material color based on average
					var material = new THREE.MeshLambertMaterial({
						color: countryColors[i%4],
					});
					
					var material = new THREE.MeshPhongMaterial({color:countryColors[i%4], opacity:0.5}); 
		
					
					// TEMP EXTRUSION
					var extrusion = 1;
					
					// create extrude based on total
					var shape3d = countries[i].mesh.extrude({amount: extrusion, bevelEnabled: false});
					
					// create a mesh based on material and extruded shape
					var toAdd = new THREE.Mesh(shape3d, material);
					
					// rotate and position the elements nicely in the center
					toAdd.rotation.x = Math.PI/2;
					toAdd.translateX(-490);
					toAdd.translateZ(50);
					toAdd.translateY(17);

					// add to scene
					this.scene.add(toAdd);
				}

		},
		
		setCameraPosition: function(x, y, z, lx, lz) {	
			this.CAMERA_X = x;
			this.CAMERA_Y = y;
			this.CAMERA_Z = z;
			this.CAMERA_LX = lx;
			this.CAMERA_LZ = lz;
		},
		
		moveCamera: function() {
			var easing = 0.2;
			var target_x = (this.CAMERA_X - this.camera.position.x) * easing;
			var target_y = (this.CAMERA_Y - this.camera.position.y) * easing;
			var target_z = (this.CAMERA_Z - this.camera.position.z) * easing;
			
			this.camera.position.x += target_x;
			this.camera.position.y += target_y;
			this.camera.position.z += target_z;
			
			this.camera.lookAt( {x: this.CAMERA_LX, y: 0, z: this.CAMERA_LZ } );
		},
		
		animate: function() {
			
			if( this.CAMERA_X != this.camera.position.x || 
				this.CAMERA_Y != this.camera.position.y || 
				this.CAMERA_Z != this.camera.position.z) {
				this.moveCamera();	
			}

			this.render();
		},
		
		render: function() {

			// actually render the scene
			this.renderer.render(this.scene, this.camera);
		}
	};
	

	

	function init() {
		
		$.when(	$.getJSON("data/countries.json"),
				$.getJSON("data/worldpopfemale.json"),
				$.getJSON("data/worldpopmale.json"),
				$.getJSON("data/worldpoptotal.json") ).then(function(countries, popFemale, popMale, popTotal){ 
			
			worldMap = new Map();
			
			worldMap.init_d3();
			worldMap.init_tree();
			
			worldMap.add_light();
			worldMap.add_plain();
			
			worldMap.add_countries(countries[0]);
			
			// request animation frame
			var onFrame = window.requestAnimationFrame;
	
			function tick(timestamp) {
				worldMap.animate();
				onFrame(tick);
			}
	
			onFrame(tick);
			
		});
	}

	window.onload = init;
	
	$('.navbar-fixed-top ul li a').click(function() {		
		switch (this.hash) {
		   case "#africa":
			  worldMap.setCameraPosition(100, 320, 200, 100, 50);
			  break;
		   case "#europe":
			  worldMap.setCameraPosition(75, 210, -75, 75, -150);
			  break;
		   case "#asia":
			  worldMap.setCameraPosition(400, 350, 100, 400, -100);
			  break;
		   case "#northamerica":
			  worldMap.setCameraPosition(-300, 350, -90, -300, -120);
			  break;
		   case "#southamerica":
		   	  worldMap.setCameraPosition(-200, 350, 250, -200, 120);
			  break;
		   case "#australia":
			  worldMap.setCameraPosition(500, 270, 300, 500, 120);
			  break;
		   case "#all":
			  worldMap.setCameraPosition(0, 1000, 500, 0, 0);
			  break;
		}
	});
	
	$( "#slider" ).slider({
        orientation: "horizontal",
        range: "min",
        min: 2010,
        max: 2050,
		step: 10,
        value: 2030,
        slide: function (event, ui) {
            var currentYear = "current year: " + ui.value;
            $("#current-year").html(currentYear);
        }
    });
    $("#current-year").html("current year: 2030");

}());