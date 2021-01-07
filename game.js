//global variables in the scene
var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var sceneWidth = 32;
var snakeGround = 28;
var stopTimer, startTime, mString, sString;
var prevTime = 0;
var time;
var isReset = false;



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


// functions to minitor the time that has passsed since the game began
var startTimer = function () {
    startTime = new Date().getTime(); //get the time when we started
    stopTimer = false;
}
var stopTime = function () {
    stopTimer = true; //controls the update of our timer
}

var formatTime = function () {
    let minsPassed = Math.floor(time / 60);
    let secPassed = time % 240; // goes back to 0 after 4mins/240sec
    // 4sec = 1min game time
    if (secPassed % 4 == 0) {
        mString = Math.floor(minsPassed / 4) + 11;
        sString = (secPassed / 4 < 10 ? "0" : "") + secPassed / 4;
    }
    let day = mString == 11 ? " PM" : " AM";
    return mString + ":" + sString + day;
}

// function that holds all the scene elements
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
    var moveForward;
    var status = "Play";



    var scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    var atmosphere = new BABYLON.Sound("Ambient", "/Sounds/game/ambient.wav", scene, null, {
        loop: true,
        autoplay: true
    });

    var gameo = new BABYLON.Sound("Ambient", "/Sounds/game/gameover.wav", scene, null, {
        loop: false,
        autoplay: false
    });
    var eatSound = new BABYLON.Sound("Ambient", "/Sounds/game/eat.wav", scene, null, {
        loop: false,
        autoplay: false
    });
    var gravityVector = BABYLON.Vector3(0, -9.81, 0);
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    // cameras used
    var camera = new BABYLON.FollowCamera("FollowCamera", new BABYLON.Vector3(0, 0, 0), scene);
    //var camera = new BABYLON.ArcFollowCamera('camera', Math.PI / 4, Math.PI / 4, 5, null, scene);
    camera.radius = 3;
    camera.heightOffet = 5;
    camera.rotationOffset = 180;
    camera.rotation.y = new BABYLON.Vector3(0, 90, 0);
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1.8, 1);
    camera.inputs.clear();


    var freeCamera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 10, -20), scene);
    freeCamera.inputs.clear();
    // This targets the camera to scene origin
    freeCamera.setTarget(BABYLON.Vector3.Zero());
    freeCamera.radius = 15;
    //  Enable camera collisions
    enableCameraCollision(freeCamera, scene);
    

    //light for the scene ,similar to the sun
    var light = new BABYLON.DirectionalLight("*dir00", new BABYLON.Vector3(0, -1, -1), scene);
    light.position = new BABYLON.Vector3(0, 10, 10);
    light.intensity = 1;

    //enabling shadows to the sccene
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;


/// naterial for the headSegment which is the main character
    var materialSphere1 = new BABYLON.StandardMaterial("texture1", scene);
    materialSphere1.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0);
    materialSphere1.roughness = 10;;
    materialSphere1.specularPower = 100;
    materialSphere1.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

// importing the main character
    headSegment = await BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "fourAni.glb", scene, function (newMeshes) {
        // newMeshes[0].material = materialSphere1;    
        newMeshes.forEach(function (mesh) {
            mesh.material = null;
            shadowGenerator.getShadowMap().renderList.push(mesh);
        })
        headSegment = newMeshes[0];
        headSegment.scaling.scaleInPlace(0.25);
        headSegment.position = new BABYLON.Vector3(2, 1.5, 2);

        moveForward = scene.getAnimationGroupByName("moveForward");
        moveForward.start(true, 0.5, moveForward.from, moveForward.to, false);
        camera.lockedTarget = headSegment;
        headSegment.material = null;
        newMeshes.forEach(function (mesh) {
            mesh.material = materialSphere1;
         
        })
        headSegment.material = materialSphere1;

        return headSegment;
    });



    function brickLooks() {
        var brickMaterial = new BABYLON.PBRMaterial("pbr", scene);
        //var matPBR = new BABYLON.PBRMaterial("matpbr", scene);

        // matPBR.metallic = 0;
        brickMaterial.roughness = 0.8;
        brickMaterial.albedoTexture = new BABYLON.Texture("textures/Rocky/Rocks003_1K_Color.jpg", scene);
        brickMaterial.detailMap.diffuseBlendLevel = 0.1;
        brickMaterial.detailMap.bumpLevel = 1;
        brickMaterial.bumpTexture = new BABYLON.Texture("textures/Rocky/Rocks003_1K_Normal.jpg", scene);
        brickMaterial.bumpTexture.level = 1;
        brickMaterial.detailMap.roughnessBlendLevel = 0.25;
        //brickMaterial.metallicTexture = new BABYLON.Texture("textures/Rocky/Rocks003_1K_Roughness.jpg", scene);
        brickMaterial.ambientTexture = new BABYLON.Texture("textures/Rocky/Rocks003_1K_AmbientOcclusion.jpg", scene);

        brickMaterial.albedoTexture.uScale = 5.0;
        brickMaterial.albedoTexture.vScale = 5.0;
        return brickMaterial;
    }



    function Wall(width, height, depth, positionY, positionZ, positionX) {
        this.wall = BABYLON.MeshBuilder.CreateBox("rect", { width: width, height: height, depth: depth }, scene);
        this.wall.position.y = positionY;
        this.wall.position.x = positionX;
        this.wall.position.z = positionZ;
        this.wall.material = brickLooks();
        shadowGenerator.getShadowMap().renderList.push(wall);
        walls.push(this.wall);
        // return this.wall;
    }

    // Wall(4, 5, 6, 2, 3, 4, 5);
    Wall(sceneWidth - 2, 2, 2, 1, snakeGround / 2, 0);
    Wall(sceneWidth - 2, 2, 2, 1, -snakeGround / 2, 0);
    Wall(2, 2, sceneWidth - 2, 1, 0, snakeGround / 2);
    Wall(2, 2, sceneWidth - 2, 1, 0, -snakeGround / 2);
    Wall(1, 2, snakeGround / 4, 0.5, 0, -snakeGround / 4);
    Wall(1, 2, snakeGround / 4, 0.5, 0, snakeGround / 4);
    Wall(snakeGround / 4, 2, 1, 0.5, snakeGround / 4, 0);
    Wall(snakeGround / 4, 2, 1, 0.5, -snakeGround / 4, 0);


    function groundLooks() {
        const diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/beautytasara27/Mesh/master/Groundy/Ground003_2K_Color.jpg", scene);
        const bumpTexture = new BABYLON.Texture("https://raw.githubusercontent.com/beautytasara27/Mesh/master/Groundy/Ground003_2K_Normal.jpg", scene);
        const metallicTexture = new BABYLON.Texture("https://raw.githubusercontent.com/beautytasara27/Mesh/master/Groundy/Ground003_2K_Roughness.jpg", scene);

        var groundMaterial = new BABYLON.PBRMaterial("matpbr", scene);
        // matPBR.metallic = 0;
        groundMaterial.roughness = 0.8;
        groundMaterial.albedoTexture = diffuseTexture;
        groundMaterial.detailMap.diffuseBlendLevel = 0.1;
        groundMaterial.detailMap.bumpLevel = 1;
        groundMaterial.bumpTexture = bumpTexture;
        groundMaterial.bumpTexture.level = 0.5;
        groundMaterial.detailMap.roughnessBlendLevel = 0.25;
        groundMaterial.metallicTexture = metallicTexture;
        return groundMaterial;
    }


    //groundMaterial.shadowlevel = 0.9;
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: sceneWidth, height: sceneWidth }, scene);
    ground.material = groundLooks();
    ground.receiveShadows = true;
//
// sky for our game
    // var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    // var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    // skyboxMaterial.backFaceCulling = false;
    // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/textures/Skybox/env", scene);
    // skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    // skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    // skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    // skybox.material = skyboxMaterial;

//function for rotation animation
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
    // function for up and down animation
    function yTranslate(frameRatey) {
        var yTrans = new BABYLON.Animation("yTrans", "position.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

        var keyFramesR = [];

        keyFramesR.push({
            frame: 0,
            value: 0.4
        });

        keyFramesR.push({
            frame: frameRatey,
            value: 0
        });

        keyFramesR.push({
            frame: 2 * frameRatey,
            value: 0.4
        });


        yTrans.setKeys(keyFramesR);
        return yTrans;

    }


    var frameRate = 5;
    //function for scaling the mushroom in xAxis : animation
    function xScaling() {
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
        return xScale;
    }

  // function for rotating the peach

    function xRotation() {
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
        return xRot;
    }

//function for up adn down movement in y axis : Animation
    function yTranslation() {
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
        return yTrans1;
    }

// function for importing the peach
   await BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "10196_Peach.obj", scene, function (newMeshes) {
        console.log("peach", newMeshes);
        newMeshes.forEach(function (mesh) {
            var mesh = newMeshes[0];
            mesh.position = new BABYLON.Vector3(-10, 0, 7);
            mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
           // mesh.rotation = new BABYLON.Vector3(-17.2, 176, -175);
            mesh.isVisible = false;
            var frameRate = 5;

            var positionsx = [9, 4, 2, 9, -8, -8, -9, -2, -3, -4, -1];
            var positionsz = [11, 3, -10, -8, 11, 6, -11, -2, -5, -2, -8];

            console.log("thats how many times");
            for (var index = 0; index <= positionsx.length; index++) {
                var newInstance = mesh.createInstance("i" + index);

                newInstance.position.x = positionsx[index];
                newInstance.position.z = positionsz[index];

                newInstance.rotation = new BABYLON.Vector3(176, -175, -17.2);

                //newInstance.moveWithCollisions(newInstance.speed);

                var animating2 = scene.beginDirectAnimation(newInstance, [xRotation(), yTranslation()], 0, 2 * frameRate, true);
                animations.push(animating2);
                eatables.push(newInstance);
                shadowGenerator.getShadowMap().renderList.push(newInstance);

            }


        })

    });

    //function for importing the mushroom
    await BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/beautytasara27/Mesh/master/", "mushroom.babylon", scene, function (newMeshes) {
        console.log("peach", newMeshes);
        // newMeshes.forEach(function (mesh) {
        var mesh = newMeshes[0];
        mesh.position = new BABYLON.Vector3(-10, 1, 7);
        mesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
        // mesh.rotation = new BABYLON.Vector3(-17.2, 176, -175);
        mesh.isVisible = false;
        var frameRate = 5;

        var positionsx = [-9, 8, 8, -9, 2, 4, 1];
        var positionsz = [  -6, 11, 5, 2, 8];

        console.log("thats how many times");
        for (var index = 0; index <= positionsx.length; index++) {
            var newInstance = mesh.createInstance("i" + index);

            newInstance.position.x = positionsx[index];
            newInstance.position.z = positionsz[index];

            //  newInstance.rotation = new BABYLON.Vector3(176, -175, -17.2);

            //newInstance.moveWithCollisions(newInstance.speed);

            //  var animating2 = scene.beginDirectAnimation(newInstance, [xRotation(), yTranslation()], 0, 2 * frameRate, true);
            // animations.push(animating2);
            poison.push(newInstance);
            shadowGenerator.getShadowMap().renderList.push(newInstance);

        }


        //  })

    });

//function to switch the camera
    var switchCamera = function (key) {

        if (key.keyCode == 67) {
            scene.activeCamera = (scene.activeCamera == camera ? freeCamera : camera);
        }
    }


    // function for moving the slug
    var onKeyDown = function (key) {
        switch (key.keyCode) {

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

                headSegment.rotate(BABYLON.Axis.Y, Math.PI / 2, BABYLON.Space.LOCAL);

                break;
            //key arrow left
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



    }

//function for creating the rectangle container of the gui
    function createRectangle(platform, visibility) {
        var rectangle = new BABYLON.GUI.Rectangle();
        rectangle.width = 0.25;
        rectangle.height = "500px";
        rectangle.cornerRadius = 20;
        rectangle.color = "black";
        rectangle.thickness = 1;
        rectangle.background = "white";
        rectangle.isVisible = visibility;
        platform.addControl(rectangle);

        return rectangle;
    }

// adding the GUI to the scene
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var containerGui = new createRectangle(advancedTexture, true)

    var mainMenu = new BABYLON.GUI.StackPanel();
    mainMenu.isVertical = true;
    // panel.height =1.8;
    mainMenu.color = "green";
    mainMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    mainMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainMenu.isVisible = true;
    containerGui.addControl(mainMenu);

    var rect1 = new BABYLON.GUI.Rectangle();
    rect1.width = 0.25;
    rect1.height = "500px";
    rect1.cornerRadius = 10;
    rect1.color = "green";
    rect1.thickness = 1;
    rect1.background = "white";
    advancedTexture.addControl(rect1);
    rect1.isVisible = false;



    const percentage = "4.5%";

    //function to create the text block for the gui
    function createTextBlock(platform, text) {
        var textBlock = new BABYLON.GUI.TextBlock("text2");
        textBlock.textWrapping = true;
        textBlock.lineSpacing = percentage;
        textBlock.width = "300px";
        textBlock.height = "400px";
        textBlock.text = text;
        textBlock.color = "black";
        textBlock.fontSize = "14px";
        platform.addControl(textBlock);
        return textBlock;
    }
    var textx = "Use arrow keys LEFT to turn the slug left and arrows key RIGHT to turn the slug right. Use keyboard C to toggle between cameras. Use keyboard P to pause the Game."
    var controls = createTextBlock(rect1, textx);
    //controls.isVisible =false;
    controls.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    controls.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    var rect2 = new createRectangle(advancedTexture, false);

    //function gameOver() {
    message = "Gameover, Your Score is :" + Score.toString();
    var gameover = createTextBlock(rect2, message);


    gameover.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    gameover.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

 
// function to add buttons on the gui panel

    var addButton = function (platform, text, callback) {
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


        platform.addControl(button);
    }

//adding button "Play"
    addButton(mainMenu, "Play", function () {
        // moveForward.play();
        if (isReset == true) {
            direction = "z";
            startTimer();
        }
        else { direction = direction }
        status = "Play";
        containerGui.isVisible = false;
        menu.isVisible = true;
        stopTimer = false;
        console.log(scene.animationGroups);

        moveForward.play();
        eatables.forEach(function (mesh) {
            var animating2 = scene.beginDirectAnimation(mesh, [xRotation(), yTranslation()], 0, 2 * frameRate, true);
            animations.push(animating2);
        })
        poison.forEach(function (mesh) {

            var animating1 = scene.beginDirectAnimation(mesh, [xScaling(), yTranslation()], 0, 2 * frameRate, true);

            animations.push(animating1);
        })
        // animations.forEach(function (animate){
        //     animate.play();
        // })
    });
    addButton(mainMenu, "Reset", function () {
        isReset = true;
        loadScene();

    });
    addButton(mainMenu, "Controls", function () {
        rect1.isVisible = true;

    });

    //function createMenuButton() {
    var menu = BABYLON.GUI.Button.CreateSimpleButton("button", "Menu");

    menu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    menu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    menu.isVisible = false;

    menu.width = "120px";
    menu.height = "40px";
    menu.color = "black";

    menu.background = "white";

    menu.onPointerUpObservable.add(function () {
        status = "Pause";
        containerGui.isVisible = true;
        menu.isVisible = false;
        moveForward.pause();
        scene.animationGroups.forEach(function (animation) {
            animation.pause();

        }
        )
        animations.forEach(function (animate) {
            animate.pause();
        })
        // scene.animatables.pause();
      //  stopTime();
        console.log("active mesh", scene)
        onPause();
    });
    advancedTexture.addControl(menu);

    //    return menu;
    // }
    // var menu = createMenuButton();

    function scoreBoard() {
        points = new BABYLON.GUI.TextBlock();
        points.name = "score";
        // clockTime.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        points.fontSize = "40px";
        points.color = "white";
        points.text = "Score :", Score.toString();
        points.resizeToFit = true;
        points.height = "96px";
        points.width = "140px";
        points.fontFamily = "Viga";
        points.outlineColor = "red";
        points.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        points.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        advancedTexture.addControl(points);
        return points;
    }
    var points = scoreBoard();
    var times = new BABYLON.GUI.TextBlock();
    times.name = "clock";
    // clockTime.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
    times.fontSize = "40px";
    times.color = "white";
    times.text = "11:00";
    times.resizeToFit = true;
    times.height = "96px";
    times.width = "140px";
    times.fontFamily = "Viga";
    times.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    times.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    advancedTexture.addControl(times);
    //     return times;
    // }
    // var times = displayTime();
    //displayTime();
    addButton(rect1, "Close", function () {
        rect1.isVisible = false;
    });


    addButton(rect2, "Close", function () {
        console.log("rect2 shid", rect2);
        rect2.isVisible = false;
        loadScene();
        isReset = true;

    });

   var onPause = function () {
        stopTime = true;
        isReset = false;
        containerGui.isVisible = true;
        menu.isVisible = false;
       

    }

    var onReset = function () {
        containerGui.isVisible = false;
        menu.isVisible = true;
        eatables.forEach(function (mesh) {
            mesh.isVisible = true;

        })

    }



    //}


    var gamePlay = function () {
      //the automated movement of the head depending on the axis and direction
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



//calculating the time

        if (!stopTimer && startTime != null) {
            let curTime = Math.floor((new Date().getTime() - startTime) / 1000) + prevTime;
            time = curTime;
            console.log("time", time);

            times.text = formatTime(curTime);
        }
//peach appears every 30 seconds
        if (time % 30 == 0) {

            eatables.forEach(function (mesh) {
                mesh.isVisible = true;
            })
        }

// registering actions for intersecting mesh
        headSegment.actionManager = new BABYLON.ActionManager(scene);

        //if the mesh in the eatables array intersect with the slug, the mmesh dissapears ie visibility is false
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

                        if (mesh.isVisible == true) {
                            eatSound.play();
                            Score += 1;
                            speed += 0.01;
                        }
                        mesh.isVisible = false;
                        points.text = "Score : " + Score.toString();
                    }
                )
            );

        });
 //if the mesh in the poison array intersect with the slug, the game is over
        poison.forEach(function (mesh) {
            headSegment.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    {
                        trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                        parameter: {
                            mesh: mesh,
                            usePreciseIntersection: true
                        }
                    },
                    function () {

                        isGameOver = true;
                        atmosphere.stop();
                        gameo.play();
                        var eat = scene.getAnimationGroupByName("Eat");
                        moveForward.stop();
                        eat.start(true, 0.5, eat.from, eat.to, false);
                        setTimeout(function () {
                            eat.stop()
                            gameo.stop()
                            rect2.isVisible = true;

                        }, 3000);
                        console.log(' Gameover, Score is', Score);


                    }
                )
            );
        });

 //if the mesh in the walls array intersect with the slug, the game is over
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
                        atmosphere.stop();
                        gameo.play();
                        gameover.text = "GameOver , Your score is :" + Score.toString();
                        var eat = scene.getAnimationGroupByName("Eat");
                        moveForward.stop();
                        eat.start(true, 0.5, eat.from, eat.to, false);
                        // isGameOver = true;
                        setTimeout(function () {
                            eat.stop()
                            gameo.stop()
                            rect2.isVisible = true;
                        }, 3000);

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

    })

    scene.registerAfterRender(function () {

        canvas.addEventListener("keydown", onKeyDown, false);
        canvas.addEventListener("keydown", switchCamera, false);
        //  canvas.addEventListener("keydown", onPause, false);
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
isReset = true;
loadScene();


engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
        sceneToRender.render();
    }
});

function init() {

    enableCameraCollision(scene.activeCamera, scene);

}

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});
