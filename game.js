//const { textureEmbedded } = require('./texture.js');
var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var sceneWidth = 32;
var snakeGround = 28;




var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };
BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
    if (document.getElementById("customLoadingScreenDiv")) {
        document.getElementById("customLoadingScreenDiv").style.display = "initial";
        // Do not add a loading screen if there is already one
        return;
    }

    this._loadingDiv = document.createElement("div");
    this._loadingDiv.id = "customLoadingScreenDiv";
    this._loadingDiv.innerHTML = "<img src='https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Loadingsome.gif/600px-Loadingsome.gif' />";
    var customLoadingScreenCss = document.createElement('style');
    customLoadingScreenCss.type = 'text/css';
    customLoadingScreenCss.innerHTML = `
    #customLoadingScreenDiv{
        background-color: #FFFFFFcc;
        color: white;
        font-size:50px;
        text-align:center;
    }
    `;
    document.getElementsByTagName('head')[0].appendChild(customLoadingScreenCss);
    this._resizeLoadingUI();
    window.addEventListener("resize", this._resizeLoadingUI);
    document.body.appendChild(this._loadingDiv);
};

BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function () {
    document.getElementById("customLoadingScreenDiv").style.display = "none";
    console.log("scene is now loaded");
}
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
var FogMode = function () {
    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    //BABYLON.Scene.FOGMODE_NONE;
    //BABYLON.Scene.FOGMODE_EXP;
    //BABYLON.Scene.FOGMODE_EXP2;
    //BABYLON.Scene.FOGMODE_LINEAR;

    scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);
    scene.fogDensity = 0.01;

    //Only if LINEAR
    //scene.fogStart = 20.0;
    //scene.fogEnd = 60.0;

    //in reg before render
    scene.fogDensity = Math.cos(alpha) / 100;
    alpha += 0.01;
}


var createScene = async function () {
    var direction;
    var Score = 0;
    var speed = 0.01;
    var isGameOver = false;

    var poison = [];
    var eatables = [];
    var walls = [];
    var headSegment;
    animations = [];
    var status = "Play";

    var scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;

    var gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    var camera = new BABYLON.FollowCamera("FollowCamera", new BABYLON.Vector3(0, 0, 6), scene);

    camera.radius = 5;
    camera.heightOffet = 5;
    camera.rotationOffeset = 90;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1.8, 1);

    var freeCamera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 10, -20), scene);
    //freeCamera.attachControl(canvas, true);
    // This targets the camera to scene origin
    freeCamera.setTarget(BABYLON.Vector3.Zero());
    freeCamera.radius = 15;
    //  Enable camera collisions
    enableCameraCollision(freeCamera, scene);
    var moveForward;



    headSegment = await BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "fourAni.glb", scene, function (newMeshes, skeletons, animationGroups) {


        headSegment = newMeshes[0];

        headSegment.scaling.scaleInPlace(0.2);
        headSegment.position = new BABYLON.Vector3(2, 1.5, 2);


        // headSegment.ellipsoid = new BABYLON.Vector3(2, 0.5, 2);
        // headSegment.physicsImpostor = new BABYLON.PhysicsImpostor(headSegment, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
        var collidersVisible = true;

        var boxCollider = BABYLON.Mesh.CreateBox("box1", 0.3, scene);
        boxCollider.position = new BABYLON.Vector3(2, 1.5, 2);
        boxCollider.isVisible = collidersVisible;

        // Create a physics root and add all children

        //headSegment.addChild(boxCollider);
        // physicsRoot.position.y+=4;

        // Enable physics on colliders first then physics root of the mesh
        //boxCollider.physicsImpostor = new BABYLON.PhysicsImpostor(boxCollider, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
        headSegment.physicsImpostor = new BABYLON.PhysicsImpostor(headSegment, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);

        // Orient the physics root
        // physicsRoot.rotation.x = Math.PI/5;
        // physicsRoot.rotation.z = Math.PI/6;
        headSegment.showBoundingBox = true;
        headSegment.rotation.y = Math.PI;
        moveForward = scene.getAnimationGroupByName("moveForward");

        moveForward.start(true, 0.5, moveForward.from, moveForward.to, false);
        // moveForward.speedRatio = 1;
        camera.lockedTarget = headSegment;
        console.log("headSeg", headSegment);
        console.log("skeletons", skeletons);
        console.log("groupps", animationGroups);

        return headSegment;
    });


    var rotate = function (angle) {
        var frameRate = 10;
        var yRot = new BABYLON.Animation(
            "yRot",
            "rotation.y",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        var keyFramesR = [];
        keyFramesR.push({
            frame: 0,
            value: 0
        });
        keyFramesR.push({
            frame: frameRate,
            value: angle / 2
        });
        keyFramesR.push({
            frame: 2 * frameRate,
            value: angle
        });
        yRot.setKeys(keyFramesR);
        scene.beginDirectAnimation(head, yRot, 0, 2 * frameRate, true);

    }
    // Segment of Snake
    //     var faceColors = new Array(6);

    //     faceColors[0] = new BABYLON.Color3(255,51,153);   // pink top
    //     faceColors[1] = new BABYLON.Color3(255,128,0);//orange
    //     faceColors[2] = new BABYLON.Color3(0,255,0);// lime grreen
    //     faceColors[3] = new BABYLON.Color3(102,102,255);//blue
    //     faceColors[4] = new BABYLON.Color3(127,0,255);//purple
    //     faceColors[5] = new BABYLON.Color3(255,153,153);
    //    // faceColors[4] = new BABYLON.Color4(0,1,0,1);
    //     var options = {
    //         width: 2,
    //         height: 2,
    //         depth: 2,
    //         faceColors : faceColors
    //       };

    //var headSegment = BABYLON.MeshBuilder.CreateBox('box', options, scene);
    // var headLooks = new BABYLON.StandardMaterial("ball_mat", scene);
    // headLooks.diffuseColor = new BABYLON.Color3(0.5, 0.9, 1);
    // var headSegment = BABYLON.Mesh.CreateBox("segment1", 0.95, scene);
    // headSegment.position.x = 5;
    // headSegment.position.z = 1;
    // headSegment.position.y = 1;
    // //headSegment.checkCollisions = true;
    // headSegment.refreshBoundingInfo();
    // headSegment.showBoundingBox = true;
    // headSegment.ellipsoid = new BABYLON.Vector3(2, 0.5, 2);
    //  headSegment.physicsImpostor = new BABYLON.PhysicsImpostor(headSegment, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 2, restitution: 0.1 }, scene);
    // camera.lockedTarget = headSegment;
    // headSegment.material = headLooks;
    //camera.setTarget = headSegment;
    // let camera = new BABYLON.VirtualJoysticksCamera("Camera", new BABYLON.Vector3(0,2.5,0), scene);
    // camera.attachControl(canvas, true);
    //     // This creates and positions a free camera (non-mesh)


    //  var camera = new BABYLON.ArcFollowCamera('camera', 0 , 0, 5, headSegment, scene);
    // 	 camera.radius = 10; // how far from the object to follow
    // 	 camera.heightOffset = 40; // how high above the object to place the camera
    // 	 camera.rotationOffset = 45; // the viewing angle
    // camera.lockedTarget = headSegment;
    //camera.moveWithCollisions(camera.speed);
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
    wall1.position.z = snakeGround / 2;
    wall1.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall1);
    wall1.physicsImpostor = new BABYLON.PhysicsImpostor(wall1, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall1);

    var wall2 = BABYLON.MeshBuilder.CreateBox("rect1", { width: sceneWidth, height: 2, depth: 2 }, scene);
    wall2.position.y = 1;
    wall2.position.z = -snakeGround / 2;
    wall2.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall2);
    wall2.physicsImpostor = new BABYLON.PhysicsImpostor(wall2, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall2);

    var wall3 = BABYLON.MeshBuilder.CreateBox("rect2", { width: 2, height: 2, depth: sceneWidth - 2 }, scene);
    wall3.position.y = 1;
    wall3.position.x = snakeGround / 2;
    wall3.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall3);
    wall3.physicsImpostor = new BABYLON.PhysicsImpostor(wall3, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall3);

    var wall4 = BABYLON.MeshBuilder.CreateBox("rect3", { width: 2, height: 2, depth: sceneWidth - 2 }, scene);
    wall4.position.y = 1;
    wall4.position.x = -snakeGround / 2;
    wall4.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall4);
    wall4.physicsImpostor = new BABYLON.PhysicsImpostor(wall4, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall4);

    var wall5 = BABYLON.MeshBuilder.CreateBox("rect4", { width: 1, height: 2, depth: snakeGround / 4 }, scene);
    wall5.position.y = 0.5;
    wall5.position.x = -snakeGround / 4;
    wall5.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall5);
    wall5.physicsImpostor = new BABYLON.PhysicsImpostor(wall5, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall5);

    var wall6 = BABYLON.MeshBuilder.CreateBox("rect5", { width: 1, height: 2, depth: snakeGround / 4 }, scene);
    wall6.position.y = 0.5;
    wall6.position.x = snakeGround / 4;
    wall6.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall6);
    wall6.physicsImpostor = new BABYLON.PhysicsImpostor(wall6, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall6);

    var wall7 = BABYLON.MeshBuilder.CreateBox("rect6", { width: snakeGround / 4, height: 2, depth: 1 }, scene);
    wall7.position.y = 0.5;
    wall7.position.z = snakeGround / 4;
    wall7.position.x = 0;
    wall7.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall7);
    wall7.physicsImpostor = new BABYLON.PhysicsImpostor(wall7, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall7);

    var wall8 = BABYLON.MeshBuilder.CreateBox("rect7", { width: snakeGround / 4, height: 2, depth: 1 }, scene);
    wall8.position.y = 0.5;
    wall8.position.x = 0;
    wall8.position.z = -snakeGround / 4;
    wall8.material = brickMaterial;
    shadowGenerator.getShadowMap().renderList.push(wall8);
    wall8.showBoundingBox = true;
    wall8.physicsImpostor = new BABYLON.PhysicsImpostor(wall8, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    walls.push(wall8);

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
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
    // groundlooks.shadowLevel = 0.9;
    //var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:10.0}, scene);
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/textures/Skybox/env", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    var value = await BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "golden-mushroom.obj", scene, function (newMeshes) {
        newMeshes.forEach(function (mesh) {

            mesh.position = new BABYLON.Vector3(-10, 5, 7);
            mesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);

            mesh.isVisible = false;



            var positionsx = [1, 8, 7, 11, -5, -6, -2, -8, -2]
            var positionsz = [2, 5, -5, -11, 10, 5, -2, -10, -2]

            for (var index = 0; index < 5; index++) {
                var newInstance = mesh.createInstance("i" + index);

                newInstance.position.x = positionsx[index];
                newInstance.position.z = positionsz[index];

                // var whaeva = scene.getAnimationGroupByName("Eatables1");
                // whaeva.start(true, 0.5, whaeva.from, whaeva.to, false);
                var animating2 = scene.beginDirectAnimation(newInstance, [xScale, yTrans], 0, 2 * frameRate, true);
                animations.push(animating2);
                //newInstance.ellipsoid = new BABYLON.Vector3(0.4, 0.8, 0.4);
                poison.push(newInstance);
                // eatables.push(newInstance);

                shadowGenerator.getShadowMap().renderList.push(newInstance);

            }


        })

    });

    // Animations
    var anims = new BABYLON.AnimationGroup("Eatables1");
    // anims.addTargetedAnimation(animation1, mesh1);
    // anims.normalize(0, 10);
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

    var yTrans1 = new BABYLON.Animation("yTrans1", "position.y", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

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



    yTrans1.setKeys(keyFramesR);

    eatables.forEach(function (mesh) {
        anims.addTargetedAnimation(yTrans1, mesh);
        anims.addTargetedAnimation(xRot, mesh);
    })
    poison.forEach(function (mesh) {
        anims.addTargetedAnimation(yTrans, mesh);
        anims.addTargetedAnimation(xScale, mesh);
    })
    // var hey = scene.getAnimationGroupByName("Eatables1");
    anims.loopAnimation = true;




BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "10196_Peach.obj", scene, function (newMeshes) {
        console.log("peach", newMeshes);
        newMeshes.forEach(function (mesh) {
           var mesh = newMeshes[0];
            mesh.position = new BABYLON.Vector3(-10, 0, 7);
            mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            mesh.rotation = new BABYLON.Vector3(-17.2, 176, -175);
            mesh.isVisible = false;
            var frameRate = 5;

            var positionsx = [9, 4, 2, 9, -8, -8, -9, -2, -3, -4, -1];
            var positionsz = [11, 3, -10, -8, 11, 6, -11, -2, -5,-2, -8];

console.log("thats how many times");
            for (var index = 0; index <= positionsx.length; index++) {
                var newInstance = mesh.createInstance("i" + index);

                newInstance.position.x = positionsx[index];
                newInstance.position.z = positionsz[index];

                newInstance.rotation = new BABYLON.Vector3(176, -175, -17.2);

                //newInstance.moveWithCollisions(newInstance.speed);

                var animating2 = scene.beginDirectAnimation(newInstance, [xRot, yTrans1], 0, 2 * frameRate, true);
                animations.push(animating2);
                eatables.push(newInstance);
                shadowGenerator.getShadowMap().renderList.push(newInstance);
            console.log("new Eatables", eatables)
            }


        })

    });
    function showWorldAxis(size) {
        var makeTextPlane = function (text, color, size) {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
            var plane = BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };
        var axisX = BABYLON.Mesh.CreateLines("axisX", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
            new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
        ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        var xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
        var axisY = BABYLON.Mesh.CreateLines("axisY", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
            new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
        ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        var yChar = makeTextPlane("Y", "green", size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
        var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
            new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
        ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        var zChar = makeTextPlane("Z", "blue", size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
    };
    showWorldAxis(5);

    var switchCamera = function (key) {

        if (key.keyCode == 67) {
            scene.activeCamera = (scene.activeCamera == camera ? freeCamera : camera);
        }
    }


    var onKeyDown = function (key) {
        function degrees_to_radians(degrees) {
            var pi = Math.PI;
            return degrees * (pi / 180);
        }


        switch (key.keyCode) {
            // key arrow top:
            //
            case 38:
                if (direction == "z") {
                    direction = "z"
                }
                else if (direction == "x") {
                    direction = "x"
                }
                else if (direction == "-z") {
                    direction = "-z"
                }
                else if (direction == "-x") {
                    direction = "-x"
                }
                else {
                    direction = "z";
                }
                //  headSegment.rotation.y = Math.PI;

                break;
            // key arrow down:
            case 40:
                if (direction == "z") {
                    direction = "-z"
                }
                else if (direction == "x") {
                    direction = "-x"
                }
                else if (direction == "-z") {
                    direction = "z"
                }
                else if (direction == "-x") {
                    direction = "x"
                }
                // headSegment.rotation.y = Math.PI;
                headSegment.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
                //  headSegment.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
                break;
            // key arrow right:
            case 39:
                if (direction == "z") {
                    direction = "x"
                }
                else if (direction == "x") {
                    direction = "-z"
                }
                else if (direction == "-z") {
                    direction = "-x"
                }
                else if (direction == "-x") {
                    direction = "z"
                }
                //  headSegment.rotation.y += -degrees_to_radians(90);
                headSegment.rotate(BABYLON.Axis.Y, Math.PI / 2, BABYLON.Space.LOCAL);
                //  headSegment.rotate(BABYLON.Axis.Y, Math.PI / 2, BABYLON.Space.LOCAL);
                // headSegment.scaling.scaleInPlace(0.5);
                //   const turnRight = scene.getAnimationGroupByName("turnRight");
                //     turnRight.start(false, 1.0, turnRight.from, turnRight.to, false);
                //     console.log("turnLeft", turnRight);
                break;
            // key arrow left:
            case 37:
                if (direction == "z") {
                    direction = "-x"
                }
                else if (direction == "x") {
                    direction = "z"
                }
                else if (direction == "-z") {
                    direction = "x"
                }
                else if (direction == "-x") {
                    direction = "-z"
                }
                headSegment.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.LOCAL);
                //  headSegment.rotation.y = -Math.PI / 2;
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
    var timing = function () {
        if (stopTimer && startTime != null) {
            let curTime = Math.floor((new Date().getTime() - startTime) / 1000) + prevTime;
            this.time = curTime;
            clockTime.text = this._formatTime(curTime);
        }
    }
    //   var scoreBoard = function () {
    // var plane1 = BABYLON.MeshBuilder.CreatePlane("plane", { height: 2, width: 1 });
    // var advancedTexture1 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
    //     plane1,
    //     1024,
    //     1024,
    //     false
    // );
    // button1 = BABYLON.GUI.Button.CreateImageWithCenterTextButton("but1", Score.toString());
    // button1.width = 3;
    // button1.height = .5;
    // button1.color = "white";
    // button1.fontSize = 200;
    // button1.background = "green";
    // advancedTexture1.addControl(button1);
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    var panel = new BABYLON.GUI.StackPanel();
    panel.isVertical = false;
    panel.height = 1.8;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(panel);

    var addButton = function (text, callback) {
        var button = BABYLON.GUI.Button.CreateSimpleButton("button", text);
        button.width = "140px";
        button.height = "40px";
        button.color = "white";
        button.background = "green";
        button.paddingLeft = "10px";
        button.paddingRight = "10px";
        button.onPointerUpObservable.add(function () {
            callback();
        });


        panel.addControl(button);
    }
    var points = new BABYLON.GUI.TextBlock();
    points.name = "clock";
    // clockTime.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
    points.fontSize = "48px";
    points.color = "white";
    points.text = "Score : 0";
    points.resizeToFit = true;
    points.height = "96px";
    points.width = "220px";
    points.fontFamily = "Viga";

    panel.addControl(points);
    addButton("Pause", function () {
        status = "Pause";
        console.log("scene on pause", scene);
        moveForward.pause();
        scene.animationGroups.forEach(function (animation) {
            animation.pause();

        }
        )
        animations.forEach(function (animate) {
            animate.pause();
        })
        // scene.animatables.pause();
        console.log("active mesh", scene)
    });

    addButton("Play", function () {
        // moveForward.play();
        status = "Play";
        //console.log(scene.animationGroups);
        scene.animationGroups.forEach(function (animation) {
            animation.play();

        }

        )

        console.log("eatables", eatables);
        eatables.forEach(function (mesh) {


            var animating2 = scene.beginDirectAnimation(mesh, [xRot, yTrans1], 0, 2 * frameRate, true);

            animations.push(animating2);
        })
        poison.forEach(function (mesh) {

            var animating1 = scene.beginDirectAnimation(mesh, [xScale, yTrans], 0, 2 * frameRate, true);

            animations.push(animating1);
        })
        // animations.forEach(function (animate){
        //     animate.play();
        // })
    });

    addButton("Reset", function () {
        loadScene();

    });

    //}


    var gamePlay = function () {
        // scoreBoard();
        // console.log("head",headSegment);

        // headSegment.moveWithCollisions(.05);
        if (direction == "z" && status != "Pause" && !isGameOver) {
            headSegment.translate(BABYLON.Axis.Z, speed, BABYLON.Space.WORLD);
        }
        else if (direction == "-z" && status != "Pause" && !isGameOver) {
            headSegment.translate(BABYLON.Axis.Z, -speed, BABYLON.Space.WORLD);
        }
        else if (direction == "x" && status != "Pause" && !isGameOver) {
            headSegment.translate(BABYLON.Axis.X, speed, BABYLON.Space.WORLD);
        }
        else if (direction == "-x" && status != "Pause" && !isGameOver) {
            headSegment.translate(BABYLON.Axis.X, -speed, BABYLON.Space.WORLD);
        }

        // if (Score > 1) {
        //     speed = 0.03;
        //     moveForward.speedRatio = 0.6;
        // }
        // else if (Score > 2) {
        //     speed = 0.04;
        //     moveForward.speedRatio = 0.7;
        // }
        // else if (Score > 3) {
        //     speed = 0.05;
        //     moveForward.speedRatio = 0.8;
        // }
        // else if (Score > 4) {
        //     speed = 0.07;
        //     moveForward.speedRatio = 1;
        // }

        headSegment.actionManager = new BABYLON.ActionManager(scene);

        eatables.forEach(function (mesh) {


            headSegment.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    {
                        trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                        parameter: {
                            mesh: mesh,
                            usePreciseIntersection: false
                        }
                    },
                    function () {
                        // console.log("eatables before:", eatables);
                        // console.log("poison", poison);
                        // console.log("intersected");
                        // console.log("disposed mesh", mesh);
                        // eatables.pop(mesh);
                        // mesh.dispose();
                        // console.log("eatables after", eatables);
                        // console.log("mesh if there",mesh);

                       if (mesh.isVisible == true) {
                             Score += 1;
                             speed += 0.01;
                         }
                        
                        mesh.isVisible = false;
                        // console.log(' Score is', Score);
                     points.text = "Score : " + Score.toString();
                    }
                )
            );



        });

        walls.forEach(function (wall) {
            headSegment.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    {
                        trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                        parameter: {
                            mesh: wall,
                            usePreciseIntersection: false
                        }
                    },
                    function () {
                        console.log("walls", walls)
                        isGameOver = true;
                        var eat = scene.getAnimationGroupByName("Eat");
                        moveForward.stop();
                        eat.start(true, 0.5, eat.from, eat.to, false);
                        // isGameOver = true;
                        console.log(' Gameover, Score is', Score);
                    }
                )
            );
        });
        poison.forEach(function (mesh) {
            headSegment.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    {
                        trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                        parameter: {
                            mesh: mesh,
                            usePreciseIntersection: false
                        }
                    },
                    function () {
                        isGameOver = true;
                        var eat = scene.getAnimationGroupByName("Eat");
                        moveForward.stop();
                        eat.start(true, 0.5, eat.from, eat.to, false);
                        // isGameOver = true;
                        console.log(' Gameover, Score is', Score);
                    }
                )
            );
        });


    }
    //Observables, observer ?
    scene.onBeforeRenderObservable.add(() => {
        //scoreBoard();
        gamePlay();
        init();
        // onIntersection(eatables); 
    })

    scene.registerAfterRender(function () {

        canvas.addEventListener("keydown", onKeyDown, false);
        canvas.addEventListener("keydown", switchCamera, false);
        // canvas.addEventListener("intersection", onIntersection, false);
        scene.onDispose = function () {
            canvas.removeEventListener("keydown", onKeyDown);
            canvas.removeEventListener("keydown", switchCamera)

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


async function loadScene() {
    if (!engine) throw 'engine should not be null.';
    engine.displayLoadingUI();
    scene = await createScene();

    engine.hideLoadingUI();
    sceneToRender = scene;
}
loadScene();

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
