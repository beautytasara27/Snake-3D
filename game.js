//const { textureEmbedded } = require('./texture.js');
var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var sceneWidth = 50;
var snakeGround = 23;
var direction = "-z";
var Score = 0;
var isGameOver = false;

var poison = [];
var eatables = [];

var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };

var enableCameraCollision = function (camera, scene) {
    // Enable gravity on the scene. Should be similar to earth's gravity. 
    scene.gravity = new BABYLON.Vector3(0, -0.98, 0);
    // Enable collisions globally. 
    scene.collisionsEnabled = true;
    // Enable collision detection and gravity on the free camera. 
    camera.checkCollisions = true;
    camera.applyGravity = true;
    // Set the player size, the camera's ellipsoid. 
    camera.ellipsoid = new BABYLON.Vector3(0.4, 0.8, 0.4);
}
var Sounds = function () {
    //atmospheric sound
    var atmosphere = new BABYLON.Sound("Ambient", "/Sounds/alphabet.mp3", scene, null, {
        loop: true,
        autoplay: true
    });

    // wild sound
    var wildSound = new BABYLON.Sound("wildy", "/Sounds/nature.mp3", scene, null, {
        loop: true,
        autoplay: true
    });

    //eating sound
    var eatingSound = new BABYLON.Sound("eating", "/Sounds/bitey.mp3", scene, null, {
        loop: true,
        autoplay: false
    });
};

var createScene = function () {
    

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
        // Segment of Snake
        var headLooks = new BABYLON.StandardMaterial("ball_mat", scene);
        headLooks.diffuseColor = new BABYLON.Color3(0.5, 0.9, 1);
        var headSegment = BABYLON.Mesh.CreateBox("segment1", 0.95, scene);
        headSegment.position.x = 4;
        headSegment.position.z = 10;
        headSegment.position.y = 0.5;
        headSegment.material = headLooks;
        //camera.setTarget = headSegment;
//     let camera = new BABYLON.VirtualJoysticksCamera("Camera", new BABYLON.Vector3(0,2.5,0), scene);
//     //camera.attachControl(canvas, false);
//     // This creates and positions a free camera (non-mesh)
//    // var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
//     camera.attachControl(canvas, true);
//     // This targets the camera to scene origin
//     camera.setTarget(BABYLON.Vector3.Zero());
    // Enable camera collisions
    //enableCameraCollision(camera, scene);
    // var camera = new BABYLON.FollowCamera("FollowCamera", new BABYLON.Vector3(0, 0, 0), scene);
    // camera.lockedTarget = headSegment;
    // camera.radius = 5;
    // camera.heightOffet = 5;
 var camera = new BABYLON.ArcFollowCamera('camera', 0 , 0, 5, headSegment, scene);
	 camera.radius = 10; // how far from the object to follow
	 camera.heightOffset = 40; // how high above the object to place the camera
	 camera.rotationOffset = 90; // the viewing angle
    
    //camera.attachControl(canvas, true);
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    //var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 30, 0), scene);
    //light similar to the sun
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, -1), scene);
    light.position = new BABYLON.Vector3(20, 40, 20);

    // Default intensity is 1. dims the light a small amount
    light.intensity = 0.8;
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    // for borders
    var brickMaterial = new BABYLON.StandardMaterial('brigx', scene);
    var brickTexture = new BABYLON.BrickProceduralTexture("bricks" + "text", 512, scene);
    brickTexture.numberOfBricksHeight = 10;
    brickTexture.numberOfBricksWidth = 20;
    brickMaterial.diffuseTexture = brickTexture;
    brickMaterial.shadowlevel = 0.6; //not doing anything?
    // Our built-in 'sphere' shape.
    var wall1 = BABYLON.MeshBuilder.CreateBox("rect", { width: sceneWidth, height: 2, depth: 2 }, scene);

    wall1.position.y = 1;
    wall1.position.z = 25;
    wall1.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall1);

    var wall2 = BABYLON.MeshBuilder.CreateBox("rect1", { width: sceneWidth, height: 2, depth: 2 }, scene);
    wall2.position.y = 1;
    wall2.position.z = -25;
    wall2.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall2);

    var wall3 = BABYLON.MeshBuilder.CreateBox("rect2", { width: 2, height: 2, depth: sceneWidth - 2 }, scene);
    wall3.position.y = 1;
    wall3.position.x = 25;
    wall3.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall3);

    var wall4 = BABYLON.MeshBuilder.CreateBox("rect3", { width: 2, height: 2, depth: sceneWidth - 2 }, scene);
    wall4.position.y = 1;
    wall4.position.x = -25;
    wall4.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall4);

    // experimenting with node Materials for the ground
    var nodeMaterial = new BABYLON.NodeMaterial("node");

    // InputBlock
    var position = new BABYLON.InputBlock("position");
    position.setAsAttribute("position");

    // TransformBlock
    var WorldPos = new BABYLON.TransformBlock("WorldPos");
    WorldPos.complementZ = 0;
    WorldPos.complementW = 1;

    // InputBlock
    var World = new BABYLON.InputBlock("World");
    World.setAsSystemValue(BABYLON.NodeMaterialSystemValues.World);

    // TransformBlock
    var Worldnormal = new BABYLON.TransformBlock("World normal");
    Worldnormal.complementZ = 0;
    Worldnormal.complementW = 0;

    // InputBlock
    var normal = new BABYLON.InputBlock("normal");
    normal.setAsAttribute("normal");

    // LightBlock
    var Lights = new BABYLON.LightBlock("Lights");
    Lights.visibleInInspector = false;
    Lights.visibleOnFrame = false;

    // InputBlock
    var Cameraposition = new BABYLON.InputBlock("Camera position");
    Cameraposition.setAsSystemValue(BABYLON.NodeMaterialSystemValues.CameraPosition);

    // MultiplyBlock
    var Multiply = new BABYLON.MultiplyBlock("Multiply");
    Multiply.visibleInInspector = false;
    Multiply.visibleOnFrame = false;

    // TextureBlock
    var Texture = new BABYLON.TextureBlock("Texture");
    Texture.texture = new BABYLON.Texture(textureEmbedded, null);
    Texture.texture.wrapU = 1;
    Texture.texture.wrapV = 1;
    Texture.texture.uAng = 0;
    Texture.texture.vAng = 0;
    Texture.texture.wAng = 0;
    Texture.texture.uOffset = 0;
    Texture.texture.vOffset = 0;
    Texture.texture.uScale = 1;
    Texture.texture.vScale = 1;
    Texture.convertToGammaSpace = false;
    Texture.convertToLinearSpace = false;

    // InputBlock
    var uv = new BABYLON.InputBlock("uv");
    uv.setAsAttribute("uv");

    // FragmentOutputBlock
    var FragmentOutput = new BABYLON.FragmentOutputBlock("FragmentOutput");
    FragmentOutput.visibleInInspector = false;
    FragmentOutput.visibleOnFrame = false;

    // TransformBlock
    var WorldPosViewProjectionTransform = new BABYLON.TransformBlock("WorldPos * ViewProjectionTransform");
    WorldPosViewProjectionTransform.complementZ = 0;
    WorldPosViewProjectionTransform.complementW = 1;

    // InputBlock
    var ViewProjection = new BABYLON.InputBlock("ViewProjection");
    ViewProjection.setAsSystemValue(BABYLON.NodeMaterialSystemValues.ViewProjection);

    // VertexOutputBlock
    var VertexOutput = new BABYLON.VertexOutputBlock("VertexOutput");
    VertexOutput.visibleInInspector = false;
    VertexOutput.visibleOnFrame = false;

    // Connections
    position.output.connectTo(WorldPos.vector);
    World.output.connectTo(WorldPos.transform);
    WorldPos.output.connectTo(WorldPosViewProjectionTransform.vector);
    ViewProjection.output.connectTo(WorldPosViewProjectionTransform.transform);
    WorldPosViewProjectionTransform.output.connectTo(VertexOutput.vector);
    WorldPos.output.connectTo(Lights.worldPosition);
    normal.output.connectTo(Worldnormal.vector);
    World.output.connectTo(Worldnormal.transform);
    Worldnormal.output.connectTo(Lights.worldNormal);
    Cameraposition.output.connectTo(Lights.cameraPosition);
    Lights.diffuseOutput.connectTo(Multiply.left);
    uv.output.connectTo(Texture.uv);
    Texture.rgb.connectTo(Multiply.right);
    Multiply.output.connectTo(FragmentOutput.rgb);

    // Output nodes
    nodeMaterial.addOutputNode(VertexOutput);
    nodeMaterial.addOutputNode(FragmentOutput);
    nodeMaterial.build();

    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: sceneWidth, height: sceneWidth }, scene);
    //var groundlooks = new BABYLON.StandardMaterial('ground', scene);
    // groundlooks.diffuseTexture = new BABYLON.Texture("textures/grass.jpg", scene);
    ground.material = nodeMaterial;
    ground.receiveShadows = true;
    // groundlooks.shadowLevel = 0.9;
	//var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:10.0}, scene);
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/textures/Skybox/env", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    var birdy = BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "birdy.obj", scene, function (newMeshes) {
        bird = newMeshes[0];
        bird.scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
        bird.position = new BABYLON.Vector3(4, 2, 24);

        bird.rotation = new BABYLON.Vector3(4.5, -3.57, -51.5);

        var translateBird = new BABYLON.Animation("loop", "position.x", 40, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        var translatex = [];
        translatex.push({
            frame: 0,
            value: 4
        });
        translatex.push({
            frame: 100,
            value: 8
        });
        translateBird.setKeys(translatex);
        var rotateBird = new BABYLON.Animation("loop", "rotation.z", 40, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        var rotatez = [];
        rotatez.push({
            frame: 0,
            value: 4.5
        });
        rotatez.push({
            frame: 100,
            value: 273
        });
        rotateBird.setKeys(rotatez);

        bird.animations = [translateBird, rotateBird];
        var nextAnimation = function () {
            scene.beginDirectAnimation(bird, [rotateBird], 0, 100, false);
        };
        scene.beginDirectAnimation(bird, [translateBird], 0, 100, false, 1, nextAnimation);
        shadowGenerator.getShadowMap().renderList.push(bird);

    });



    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "golden-mushroom.obj", scene, function (newMeshes) {
        newMeshes.forEach(function (mesh) {
            mesh.position = new BABYLON.Vector3(-10, 0, 7);
            mesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);

            mesh.isVisible = false;
            var frameRate = 5;


            //Position Animation
            var xScale = new BABYLON.Animation("xScale", "scaling.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

            var keyFramesP = [];

            keyFramesP.push({
                frame: 0,
                value: 0.35
            });

            keyFramesP.push({
                frame: frameRate,
                value: 0.3
            });

            keyFramesP.push({
                frame: 2 * frameRate,
                value: 0.35
            });


            xScale.setKeys(keyFramesP);

            //Rotation Animation
            var yTrans = new BABYLON.Animation("yTrans", "position.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

            var keyFramesR = [];

            keyFramesR.push({
                frame: 0,
                value: 0.4
            });

            keyFramesR.push({
                frame: frameRate,
                value: 0
            });

            keyFramesR.push({
                frame: 2 * frameRate,
                value: 0.4
            });


            yTrans.setKeys(keyFramesR);


            var positionsx = [-10, 5, 8, -2, -17]
            var positionsz = [-17, -2, 9, 3, 8]

            for (var index = 0; index < 5; index++) {
                var newInstance = mesh.createInstance("i" + index);

                newInstance.position.x = positionsx[index];
                newInstance.position.z = positionsz[index];
                //newInstance.ellipsoid = new BABYLON.Vector3(0.4, 0.8, 0.4);
                eatables.push(newInstance);
                scene.beginDirectAnimation(newInstance, [xScale, yTrans], 0, 2 * frameRate, true);
                shadowGenerator.getShadowMap().renderList.push(newInstance);
            }


        })

    });


    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "10196_Peach.obj", scene, function (newMeshes) {
        newMeshes.forEach(function (mesh) {
            mesh.position = new BABYLON.Vector3(-10, 1, 7);
            mesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
            mesh.rotation = new BABYLON.Vector3(-17.2, 176, -175);
            mesh.isVisible = false;
            var frameRate = 5;


            //Position Animation
            var xRot = new BABYLON.Animation("xRot", "rotation.y", 1, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

            var keyFramesP = [];

            keyFramesP.push({
                frame: 0,
                value: -175
            });

            keyFramesP.push({
                frame: frameRate,
                value: -175
            });
            keyFramesP.push({
                frame: 2 * frameRate,
                value: -175
            });



            xRot.setKeys(keyFramesP);

            //Rotation Animation
            var yTrans = new BABYLON.Animation("yTrans", "position.y", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

            var keyFramesR = [];

            keyFramesR.push({
                frame: 0,
                value: 1
            });

            keyFramesR.push({
                frame: frameRate,
                value: 1.5
            });

            keyFramesR.push({
                frame: 2 * frameRate,
                value: 1
            });



            yTrans.setKeys(keyFramesR);

            var positionsx = [-15, 7, -3, 1, 20]
            var positionsz = [-6, 13, 9, -7, 5]

            for (var index = 0; index < 5; index++) {
                var newInstance = mesh.createInstance("i" + index);

                newInstance.position.x = positionsx[index];
                newInstance.position.z = positionsz[index];
                newInstance.rotation = new BABYLON.Vector3(176, -175, -17.2);

                eatables.push(newInstance);
                scene.beginDirectAnimation(newInstance, [xRot, yTrans], 0, 2 * frameRate, true);
                shadowGenerator.getShadowMap().renderList.push(newInstance);
            }


        })

    });

    var logLooks = new BABYLON.StandardMaterial('log', scene);
    logLooks.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/beautytasara27/Mesh/master/textures/barky.jpg", scene);

    var woodMaterial = new BABYLON.StandardMaterial("wood", scene);
    var woodTexture = new BABYLON.WoodProceduralTexture("woodtexture" + "text", 1024, scene);
    woodTexture.ampScale = 80.0;
    woodMaterial.diffuseTexture = woodTexture;

    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "log.obj", scene, function (newMeshes) {
        logs = newMeshes[0];
        logs.position = new BABYLON.Vector3(-10, 0.4, 1);
        logs.scaling = new BABYLON.Vector3(1, 1, 1);
        logs.material = logLooks;
        shadowGenerator.getShadowMap().renderList.push(logs);
    });

    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "log.obj", scene, function (newMeshes) {
        logs1 = newMeshes[0];
        logs1.position = new BABYLON.Vector3(5, 0.4, 10);
        logs1.scaling = new BABYLON.Vector3(1, 1, 1);
        logs1.material = woodMaterial;
        eatables.push(logs1);
        shadowGenerator.getShadowMap().renderList.push(logs1);
    });
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "longlog.obj", scene, function (newMeshes) {
        logs2 = newMeshes[0];
        logs2.position = new BABYLON.Vector3(-11, 0.4, -9);
        logs2.scaling = new BABYLON.Vector3(1, 1, 1);
        logs2.material = logLooks;
        eatables.push(logs2);
        shadowGenerator.getShadowMap().renderList.push(logs2);
    });


    var energyLooks = new BABYLON.StandardMaterial("energy_mat", scene);
    energyLooks.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.5);



    var energySegment = BABYLON.Mesh.CreateBox("energy1", 0.7, scene);
    energySegment.position.x = 2;
    energySegment.position.z = 7;
    energySegment.position.y = 0.5;
    energySegment.material = energyLooks;
    eatables.push(energySegment);

    var energySegment2 = BABYLON.Mesh.CreateBox("energy1", 0.7, scene);
    energySegment2.position.x = 5;
    energySegment2.position.z = 7;
    energySegment2.position.y = 0.5;
    energySegment2.material = energyLooks;
    eatables.push(energySegment2);

    var onKeyDown = function (key) {

        switch (key.keyCode) {
            // key arrow top:
            //
            case 38:
                direction = "z";
                break;
            // key arrow down:
            case 40:
                direction = "-z";
                break;
            // key arrow right:
            case 39:
                direction = "x";
                break;
            // key arrow left:
            case 37:
                direction = "-x";
                break;
        }


        // for (var mesh = 0; mesh < eatables.length; mesh++) {


        //     // intersection
        //     if (headSegment.intersectsMesh(eatables[mesh], false)) {
        //         // eatingSound.play();
        //         headSegment.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
        //         eatables[mesh].isVisible = false;



        //     }

    }
    var startGame = function () {
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but1", "Click Me");
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "white";
        button1.cornerRadius = 20;
        button1.background = "green";
        button1.onPointerUpObservable.add(function () {
            alert("you did it!");
        });
        advancedTexture.addControl(button1);
    }
    var scoreBoard = function () {
        var plane1 = BABYLON.MeshBuilder.CreatePlane("plane", { height: 2, width: 1 });
        var advancedTexture1 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
            plane1,
            1024,
            1024,
            false
          );
        button1 = BABYLON.GUI.Button.CreateImageWithCenterTextButton("but1", Score.toString());
        button1.width = 3;
        button1.height = .5;
        button1.color = "white";
        button1.fontSize = 200;
        button1.background = "green";
        advancedTexture1.addControl(button1);
    }


    var gamePlay = function () {
       // scoreBoard();
        if (headSegment.position.z < snakeGround & direction == "-z") {
            headSegment.translate(BABYLON.Axis.Z, .05, BABYLON.Space.LOCAL);
        }
        else if (headSegment.position.z > -snakeGround & direction == "z") {
            headSegment.translate(BABYLON.Axis.Z, -.05, BABYLON.Space.LOCAL);
        }
        else if (headSegment.position.x < snakeGround & direction == "-x") {
            headSegment.translate(BABYLON.Axis.X, .05, BABYLON.Space.LOCAL);
        }
        else if (headSegment.position.x > -snakeGround & direction == "x") {
            headSegment.translate(BABYLON.Axis.X, -.05, BABYLON.Space.LOCAL);
        }
        for (var mesh = 0; mesh < eatables.length; mesh++) {


            // intersection
            if (headSegment.intersectsMesh(eatables[mesh], false)) {
                // eatingSound.play();
                headSegment.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
                eatables[mesh].isVisible = false;
                Score += 1;
                // energySegment.position.x = Math.floor((Math.random() * ((sceneXSize - 1))) + -((sceneXSize - 1) / 2));
                // energySegment.position.z = Math.floor((Math.random() * ((sceneZSize - 1))) + -((sceneZSize - 1) / 2));
                // maxString = Score.toString();


            }
        };
    }
    //Observables, observer ?
    scene.onBeforeRenderObservable.add(() => {

        gamePlay();
        init();
        // onIntersection(eatables);
    })

    scene.registerAfterRender(function () {

        canvas.addEventListener("keydown", onKeyDown, false);
        // canvas.addEventListener("intersection", onIntersection, false);
        scene.onDispose = function () {
            canvas.removeEventListener("keydown", onKeyDown);

        }
    })
    return scene;
};

function enableMeshesCollision(meshes) {
    meshes.forEach(function (mesh) {
        mesh.checkCollisions = true;
    });
}
var engine;
try {
    engine = createDefaultEngine();
} catch (e) {
    console.log("the available createEngine function failed. Creating the default engine instead");
    engine = createDefaultEngine();
}
if (!engine) throw 'engine should not be null.';
scene = createScene();;
sceneToRender = scene;

engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
        sceneToRender.render();
    }
});

function init() {
    // onIntersection(eatables);
    enableCameraCollision(scene.activeCamera, scene);
    // enableMeshesCollision(eatables);
}

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});
