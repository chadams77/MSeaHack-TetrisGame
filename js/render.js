window.OC = window.OC || {};

Date.timeStamp = function() {
    return new Date().getTime() / 1000.0;
};

OC._render = function() {

    this.init = function (canvas2D, canvas3D) {

        window.Vec2 = THREE.Vector2;
        window.Vec3 = THREE.Vector3;
        window.Mat3 = THREE.Matrix3;
        window.Mat4 = THREE.Matrix4;

        this.c2d = canvas2D;
        this.c3d = canvas3D;

        this.ctx = this.c2d.getContext('2d');

        this.scene = new THREE.Scene();

        this.cam = new THREE.PerspectiveCamera(60, 1.5, 0.1, 256);
        this.cam.matrixAutoUpdate = true;
        this.cam.position.set(10, 10, 10);
        this.cam.lookAt(new Vec3(0, 0, 0));
        this.cam.updateProjectionMatrix();
        this.cam.updateMatrix();

        this.renderer = new THREE.WebGLRenderer({ canvas: this.c3d, alpha: true, antialias: false });
        this.renderer.setClearColor( 0x000000, 0x00 );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
        this.raycaster = new THREE.Raycaster();

        this.composer = new THREE.EffectComposer( this.renderer );
        this.renderPass = new THREE.RenderPass( this.scene, this.cam )
        this.renderPass.renderToScreen = false;
        this.composer.addPass( this.renderPass );
        this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
        this.composer.addPass( this.effectFXAA );
        this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 1.0, 0.85);
        this.composer.addPass( this.bloomPass );
        this.copyShader = new THREE.ShaderPass(THREE.CopyShader);
        this.copyShader.renderToScreen = true;
        this.composer.addPass( this.copyShader );

        this.viewport = null;
        this.setViewport();

        this.light = new THREE.SpotLight(0xffffff, 1.75, 350, Math.PI/6);
        this.light.position.z = 100;
        this.light.position.y = 75;
        this.light.position.x = 100;
        this.light.castShadow = true;
        this.light.shadow.mapSize.width = 2048;
        this.light.shadow.mapSize.height = 2048;
        this.light.shadow.camera.near = 5;
        this.light.shadow.camera.far = 50;
        this.light.shadow.camera.fov = 60;
        this.scene.add(this.light);

        window.requestAnimationFrame(this.newFrame.bind(this));
    };

    this.setViewport = function() {

        var w = window.innerWidth, h = window.innerHeight;

        if (!this.viewport || this.viewport.x !== w || this.viewport.y !== h) {
            this.c2d.width = this.c3d.width = w;
            this.c2d.height = this.c3d.height = h;
            this.viewport = this.viewport || new Vec2(0, 0);
            this.viewport.x = w;
            this.viewport.y = h;
            this.effectFXAA.uniforms['resolution'].value.set(1 / this.viewport.x, 1 / this.viewport.y );
            this.bloomPass.resolution.set(1 / this.viewport.x, 1 / this.viewport.y );
            this.renderer.setSize(this.viewport.x, this.viewport.y);
            this.composer.setSize(this.viewport.x, this.viewport.y);
            this.cam.aspect = this.viewport.x / this.viewport.y;
            this.cam.updateProjectionMatrix();
            this.renderer.setPixelRatio(window.devicePixelRatio);
        }
    };

    this.time = 0.0;
    this.lastTime = Date.timeStamp();
    this.dt = 1/60;
    this.lastDt = 1/60;
    this.frame = 0;

    this.newFrame = function() {

        window.requestAnimationFrame(this.newFrame.bind(this));
        
        //this.renderer.render(this.scene, this.cam);
        this.composer.render();
        this.frame += 1;
        var time = Date.timeStamp();
        this.dt = time - this.lastTime;
        if (this.dt > 1/10) {
            this.dt = 1/10;
        }
        this.dt = (this.lastDt + this.dt) * 0.5;
        this.lastDt = this.dt;
        this.time += this.dt;
        this.lastTime = time;

        this.setViewport();

        this.ctx.clearRect(0, 0, this.viewport.x, this.viewport.y);

        if (OC.game && OC.game.newFrame) {
            OC.game.newFrame(this.ctx, this.dt);
        }

    };
}
OC.render = new OC._render();