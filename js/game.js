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
    this.gridD = {};

    this.initGrid = function() {
        this.grid = {};
        this.gridM = {};
        this.gridD = {};
        for (var x=-this.G_BASE; x<=this.G_BASE; x++) {
            for (var y=-this.G_BASE; y<=this.G_BASE; y++) {
                for (var z=-this.G_BASE; z<=this.G_BASE; z++) {
                    this.set(KEY(x, y, z), ~~(Math.random()*6));
                }
            }
        }
    };

    this.setD = function(key, value) {
        if (!key) {
            return false;
        }
        this.gridD[key] = !!value;
    };

    this.getD = function(key, value) {
        if (!key) {
            return false;
        }
        return this.gridD[key] || false;
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

    this.moveBuffer = [];

    this.move = function(keys, keyd) {
        if (!keys || !keyd) {
            return false;
        }
        this.moveBuffer.push([
            keyd,
            keys,
            this.gridM[keys],
            this.grid[keys],
            this.gridD[keys]
        ]);
        return true;
    };

    this.finishMove = function() {
        if (!this.moveBuffer) {
            return;
        }
        for (var i=0; i<this.moveBuffer.length; i++) {
            var M = this.moveBuffer[i];
            this.gridM[M[1]] = null;
            this.grid[M[1]] = null;
            this.gridD[M[1]] = null;
        }
        for (var i=0; i<this.moveBuffer.length; i++) {
            var M = this.moveBuffer[i];
            this.gridM[M[0]] = M[2];
            this.grid[M[0]] = M[3];
            this.gridD[M[0]] = M[4];
        }
        this.moveBuffer = [];
    }

    this.updateM = function(x, y, z, dt) {
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
            obj.under = false;
            obj.mesh = new THREE.Mesh(this.cubeGeom, this.cubeMats[type-1] || this.cubeMats[0]);
            //obj.mesh.castShadow = true;
            //obj.mesh.receiveShadow = true;
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
            obj.dropper = false;
            obj = null;
            this.setM(key, null);
        }

        if (obj && this.getD(key)) {
            obj.dropper = true;
            obj.t = 0.0;
            this.setD(key, false);
            if (!this.drops) {

            }
            else {
                this.drops.push({
                    x: x, y: y, z: z, clr: type,
                    obj: obj
                });
            }
        }
        else if (obj && obj.mesh) {
            if (obj.under) {
                obj.mesh.material = this.underMat;
                obj.under = false;
            }
            else {
                obj.mesh.material = this.cubeMats[type-1] || this.cubeMats[0];
            }
        }

        if (obj && obj.dropper) {
            obj.t += dt;
            obj.mesh.position.set(
                x-this.ors.x*obj.t,
                y-this.ors.y*obj.t,
                z-this.ors.z*obj.t
            );
            obj.mesh.updateMatrix();
        }
    };

    this.checkDrops = function(x, y, z, dt) {

        var key = KEY(x,y,z);
        if (!key) {
            return;
        }
        var obj = this.getM(key);
        var type = this.get(key);

        if (obj && obj.dropper && type > 0) {
            for (var t=0; t<this.G_SIZE; t++) {
                var v = null;
                var key2 = KEY(x-this.ors.x*t, y-this.ors.y*t, z-this.ors.z*t);
                if ((v = this.getM(key2)) && (this.get(key2)) && !v.dropper) {
                    if ((obj.t+1) >= t) {
                        for (var i=0; i<this.drops.length; i++) {
                            this.drops[i].obj.dropper = false;
                            this.set(KEY(this.drops[i].x, this.drops[i].y, this.drops[i].z), 0);
                            this.set(KEY(this.drops[i].x-this.ors.x*(t-1), this.drops[i].y-this.ors.y*(t-1), this.drops[i].z-this.ors.z*(t-1)), this.drops[i].clr);
                        }
                        this.drops = null;
                    }
                    else {
                        v.under = true;
                    }
                    break;
                }
            }
        }
    }

    this.createDropper = function(x, y, z, n, clr) {
        var key = KEY(x, y, z);
        if (!key || this.get(key) > 0) {
            return false;
        }
        this.set(key, clr);
        var valid = n <= 1, k=100;
        while (!valid && (k--) > 0) {
            var r = Math.random();
            if (r < (1/6)) {
                valid = valid || this.createDropper(x-1,y,z, n-1, clr);
            }
            else if (r < (2/6)) {
                valid = valid || this.createDropper(x+1,y,z, n-1, clr);
            }
            else if (r < (3/6)) {
                valid = valid || this.createDropper(x,y-1,z, n-1, clr);
            }
            else if (r < (4/6)) {
                valid = valid || this.createDropper(x,y+1,z, n-1, clr);
            }
            else if (r < (5/6)) {
                valid = valid || this.createDropper(x,y,z-1, n-1, clr);
            }
            else {
                valid = valid || this.createDropper(x,y,z+1, n-1, clr);
            }
        }
        if (!valid) {
            this.set(key, 0);
        }
        else {
            this.setD(key, true);
        }
        return valid;
    };

    this.init = function() {
        this.bClicked = -1;
        if (!this.clickHandler) {
            this.clickHandler = function(e){
                if (e.type === 'touchstart') {
                    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                    e.pageX = touch.pageX;
                    e.pageY = touch.pageY;
                }
                this.bClicked = -1;
                for (var i=0; i<this.buttons.length; i++) {
                    var B = this.buttons[i];
                    var x = B.x - B.size * 0.5;
                    var y = B.y - B.size * 0.5;
                    if (e.pageX >= x && e.pageY >= y && e.pageX <= (x + B.size) && e.pageY <= (y + B.size)) {
                        this.bClicked = i;
                        break;
                    }
                }
                e.preventDefault();
                return false;
            }.bind(this);
            $(OC.render.c2d).on('touchstart', this.clickHandler);
            $(OC.render.c2d).on('click', this.clickHandler);
        }
        if (!this.cubeGeom) {
            this.cubeGeom = new THREE.BoxBufferGeometry( 0.9, 0.9, 0.9 );
        }
        if (!this.underMat) {
            this.underMat = new THREE.MeshPhongMaterial({
              color      : new THREE.Color("rgb(255,255,255)"),
              emissive   : new THREE.Color("rgb(255,255,255)"),
              specular   : new THREE.Color("rgb(255,255,255)"),
              shininess  : 5,
              shading    : THREE.SmoothShading
            });
        }
        if (!this.cubeMats) {
            this.cubeMats = [
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(80,80,80)"),
                  emissive   : new THREE.Color("rgb(32,32,32)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(255,0,0)"),
                  emissive   : new THREE.Color("rgb(32,32,32)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(0,255,0)"),
                  emissive   : new THREE.Color("rgb(32,32,32)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(0,0,255)"),
                  emissive   : new THREE.Color("rgb(32,32,32)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(0,255,255)"),
                  emissive   : new THREE.Color("rgb(32,32,32)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                }),
                new THREE.MeshPhongMaterial({
                  color      : new THREE.Color("rgb(255,255,0)"),
                  emissive   : new THREE.Color("rgb(32,32,32)"),
                  specular   : new THREE.Color("rgb(255,255,255)"),
                  shininess  : 5,
                  shading    : THREE.SmoothShading
                })
            ];
        }
        if (!this.images) {
            this.images = {
                right: 'img/right.png',
                left: 'img/left.png',
                up: 'img/up.png',
                down: 'img/down.png',
                rotxy: 'img/rotxy.png',
                rotyz: 'img/rotyz.png',
            };
            for (var key in this.images) {
                var url = this.images[key];
                var img = new Image();
                img.src = url;
                this.images[key] = img;
            }
        }
    };

    this.start = function() {
        this.G_LIMIT = 8;
        this.G_BASE = 2;
        this.G_SIZE = 1 + this.G_LIMIT * 2;
        this.D_SIZE = 4;

        this.ORS = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 1)
        ];
        this.ors = this.ORS[Math.floor(Math.random()*100000) % this.ORS.length];

        this.initGrid();
        this.init();

        this.drops = null;

        this.playing = true;
    };

    this.drops = null;
    this.drop = function() {
        this.ors = this.ORS[Math.floor(Math.random()*100000) % this.ORS.length];
        this.createDropper(
            Math.floor((1-this.ors.x) * this.G_BASE * Math.random()) + this.ors.x * this.G_LIMIT,
            Math.floor((1-this.ors.y) * this.G_BASE * Math.random()) + this.ors.y * this.G_LIMIT,
            Math.floor((1-this.ors.z) * this.G_BASE * Math.random()) + this.ors.z * this.G_LIMIT,
            this.D_SIZE, 1 + ~~(Math.random()*6)
        );
        this.drops = [];
    };

    this.buttons = [ {}, {}, {}, {}, {}, {} ];

    this.newFrame = function(ctx, dt) {

        var vpw = OC.render.viewport.x, vph = OC.render.viewport.y;
        var bsize = Math.min(vpw, vph) * 0.15;

        var B = this.buttons[0];
        B.img = this.images.up;
        B.x = vpw - bsize * 1.25;
        B.y = vph - bsize * 1.75 - bsize * 0.25;

        var B = this.buttons[1];
        B.img = this.images.down;
        B.x = vpw - bsize * 1.25;
        B.y = vph - bsize * 0.25 - bsize * 0.25;

        var B = this.buttons[2];
        B.img = this.images.right;
        B.x = vpw - bsize * 0.5;
        B.y = vph - bsize * 1 - bsize * 0.25;

        var B = this.buttons[3];
        B.img = this.images.left;
        B.x = vpw - bsize * 2;
        B.y = vph - bsize * 1 - bsize * 0.25;

        var B = this.buttons[4];
        B.img = this.images.rotxy;
        B.x = bsize * 0.75;
        B.y = vph - bsize * 0.5 - bsize * 0.25;

        var B = this.buttons[5];
        B.img = this.images.rotyz;
        B.x = bsize*2;
        B.y = vph - bsize * 0.5 - bsize * 0.25;

        if (this.bClicked >= 0 && this.bClicked <= 3 && this.drops) {
            var pdir = new THREE.Vector2(0, 0);
            if (this.bClicked === 0) { pdir.x = 0; pdir.y = -1; }
            else if (this.bClicked === 1) { pdir.x = 0; pdir.y = 1; }
            else if (this.bClicked === 3) { pdir.x = -1; pdir.y = 0; }
            else if (this.bClicked === 2) { pdir.x = 1; pdir.y = 0; }
            var dir = new THREE.Vector3(0, 0, 0);
            if (this.ors.x > 0.5) {
                dir.y = -pdir.x;
                dir.z = pdir.y;
            }
            else if (this.ors.y > 0.5) {
                dir.x = pdir.x;
                dir.z = pdir.y;
            }
            else if (this.ors.z > 0.5) {
                dir.x = -pdir.x;
                dir.y = pdir.y;
            }
            var good = true;
            for (var i=0; i<this.drops.length; i++) {
                var D = this.drops[i];
                var t = D.obj.t || 0;
                var it = Math.floor(D.obj.t || 0);
                var x = D.x-this.ors.x*it, y = D.y-this.ors.y*it, z = D.z-this.ors.z*it;
                var nx = x + dir.x, ny = y + dir.y, nz = z + dir.z;
                var nkey = KEY(nx, ny, nz);
                var obj = this.getM(nkey);
                if (!nkey || (obj && !obj.dropper)) {
                    good = false;
                    break;
                }
            }
            if (good) {
                for (var i=0; i<this.drops.length; i++) {
                    var D = this.drops[i];
                    var t = D.obj.t || 0;
                    var it = Math.floor(D.obj.t || 0);
                    var x = D.x-this.ors.x*it, y = D.y-this.ors.y*it, z = D.z-this.ors.z*it;
                    var nx = x + dir.x, ny = y + dir.y, nz = z + dir.z;
                    this.move(KEY(D.x, D.y, D.z), KEY(nx, ny, nz));
                    D.x = nx; D.y = ny; D.z = nz;
                    D.obj.t = t - it;
                }
                this.finishMove();
            }
        }

        this.bClicked = -1;

        for (var i=0; i<this.buttons.length; i++) {
            var B = this.buttons[i];
            B.size = bsize;
            if (B.img && B.img.width && B.img.height) {
                ctx.drawImage(B.img, 0, 0, B.img.width, B.img.height, B.x - bsize * 0.5, B.y - bsize * 0.5, bsize, bsize);
            }
        }

        ctx.font = "15px Arial";
        ctx.fillStyle = "#aaa";
        ctx.fillText(Math.floor(1/dt) + "fps " + this.ors.x + ',' + this.ors.y + ',' + this.ors.z, 15, 30);

        for (var x=-this.G_LIMIT; x<=this.G_LIMIT; x++) {
            for (var y=-this.G_LIMIT; y<=this.G_LIMIT; y++) {
                for (var z=-this.G_LIMIT; z<=this.G_LIMIT; z++) {
                    this.updateM(x, y, z, dt);
                }
            }
        }

        for (var x=-this.G_LIMIT; x<=this.G_LIMIT; x++) {
            for (var y=-this.G_LIMIT; y<=this.G_LIMIT; y++) {
                for (var z=-this.G_LIMIT; z<=this.G_LIMIT; z++) {
                    this.checkDrops(x, y, z, dt);
                }
            }
        }

        var cam = OC.render.cam;

        cam.up.set(
            cam.up.x + (this.ors.x - cam.up.x) * dt * 3.0,
            cam.up.y + (this.ors.y - cam.up.y) * dt * 3.0,
            cam.up.z + (this.ors.z - cam.up.z) * dt * 3.0
        );
        cam.lookAt(new Vec3(0, 0, 0));
        cam.updateProjectionMatrix();
        cam.updateMatrix();

        if (!this.drops) {
            this.drop();
        }

    }.bind(this);

};

OC.game = new OC._game();