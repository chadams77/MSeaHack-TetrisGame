window.OC = window.OC || {};

OC._game = function() {

    this.playing = false;

    this.G_LIMIT = 10;
    this.G_BASE = 3;
    this.G_SIZE = 1 + this.G_LIMIT * 2;

    var KEY = function(x, y, z) { // (0, 0, 0) is the center block
        if (x < -this.G_LIMIT || x > this.G_LIMIT || y < -this.G_LIMIT || y > this.G_LIMIT || z < -this.G_LIMIT || z > this.G_LIMIT) {
            return null;
        }
        return (x+50)+(y+50)*50+(z+50)*50*50;
    };

    this.grid = {};
    this.gridM = {};

    this.initGrid = function() {
        this.grid = {};
        this.gridM = {};
        for (var x=-this.G_BASE; x<=this.G_BASE; x++) {
            for (var y=-this.G_BASE; y<=this.G_BASE; y++) {
                for (var z=-this.G_BASE; z<=this.G_BASE; z++) {
                    this.set(KEY(x, y, z), 1);
                }
            }
        }
    };

    this.set = function(key, value) {
        if (!key) {
            return false;
        }
        this.grid[key] = value;
        return true;
    };

    this.get = function(key, value) {
        if (!key) {
            return null;
        }
        var ret = this.grid[key];
        if (typeof ret !== typeof 1) {
            return 0;
        }
        else {
            return ret;
        }
    };

    this.setM = function(key, value) {
        if (!key) {
            return false;
        }
        this.gridM[key] = value;
        return true;
    };

    this.getM = function(key, value) {
        if (!key) {
            return null;
        }
        return this.gridM[key] || null;
    };

    this.updateM = function(x, y, z) {
        var key = KEY(x,y,z);
        if (!key) {
            return;
        }
        var type = this.get(key);
        var obj = this.getM(key);
        if (type > 0 && !obj) {
            // add
            obj = {};
            obj.type = type;
            obj.mesh = new THREE.Mesh(this.cubeGeom, this.cubeMats[type-1] || this.cubeMats[0]);
            obj.mesh.position.set(x, y, z);
            OC.render.scene.add(obj.mesh);
            this.setM(key, obj);
        }
        else if (type > 0 && obj.type !== type) {
            // update
        }
        else if (type <= 0 && obj) {
            // remove
            obj.mesh.material = null;
            obj.mesh.geometry = null;
            OC.render.scene.remove(obj.mesh);
            obj.mesh = null;
            this.setM(key, null);
        }
    };

    this.init = function() {
        if (!this.cubeGeom) {
            this.cubeGeom = new THREE.CubeGeometry( 0.9, 0.9, 0.9 );
        }
        if (!this.cubeMats) {
            this.cubeMats = [
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(80,80,80)"),
                  emissive   : new THREE.Color("rgb(128,128,128)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(255,0,0)"),
                  emissive   : new THREE.Color("rgb(128,128,128)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(0,255,0)"),
                  emissive   : new THREE.Color("rgb(128,128,128)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(0,0,255)"),
                  emissive   : new THREE.Color("rgb(128,128,128)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(0,255,255)"),
                  emissive   : new THREE.Color("rgb(128,128,128)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(255,255,0)"),
                  emissive   : new THREE.Color("rgb(128,128,128)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                })
            ];
        }
    };

    this.start = function() {
        this.G_LIMIT = 6;
        this.G_BASE = 2;
        this.G_SIZE = 1 + this.G_LIMIT * 2;

        this.initGrid();
        this.init();

        this.playing = true;
    };

    this.newFrame = function(ctx, dt) {

        ctx.font = "15px Arial";
        ctx.fillStyle = "#aaa";
        ctx.fillText(Math.floor(1/dt) + "fps", 15, 30);

        for (var x=-this.G_LIMIT; x<=this.G_LIMIT; x++) {
            for (var y=-this.G_LIMIT; y<=this.G_LIMIT; y++) {
                for (var z=-this.G_LIMIT; z<=this.G_LIMIT; z++) {
                    this.updateM(x, y, z);
                }
            }
        }

    }.bind(this);

};

OC.game = new OC._game();