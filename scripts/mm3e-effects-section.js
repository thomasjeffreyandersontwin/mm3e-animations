
 
Hooks.on("ready", () => {  
    Hooks.on('rollPower', async (atk, token,strategie, altKey) => {
        let powerItem = new PowerItem(atk);
        powerItem.animation.play(token);
        })

    Hooks.on('rollAttack', async (atk, token,strategie, altKey) => {
        let item = token.actor.items.get(atk.links.pwr)
        let powerItem = new PowerItem(item);
        powerItem.animation.play(token); 
    })
    Hooks.on('renderItemSheet', (app, html, data) => {   
        if (!html.find('.header-button.control.my-custom-button').length) {
            console.log('Adding the original buttion with a  change');  
          const button = $(`   
            <a class="header-button control my-custom-button" 
               title="Edit Power Animation" 
               style="display: flex; align-items: center; gap: 5px; background: transparent; border: none; color: white; padding: 0; cursor: pointer;">
              <i class="fas fa-film"></i>
              <span>Edit</span>
            </a>
          `); 
      
          const appId = app.appId;
          const header = $(`.app[data-appid="${appId}"] .window-header.flexrow.draggable.resizable`);
          const configButton = header.find('.header-button.control.configure-sheet');
       
          if (configButton.length) {
            configButton.before(button);
          }  
      
          button.on('click', async (event) => {
            event.preventDefault();
                GameHelper.SequenceRunnerHelper(app);
      
          });
        }
    });
    
    Hooks.on("renderActorSheet", (app, html, data) => {
        html.find(".pwr.summary").each((index, element) => {
            const powerSummary = $(element);
            const powerName = powerSummary.find(".pwrheader .header").text().trim();
            let animationText;
            if (powerName) {
                const itemId = powerSummary.data("item-id");
                const item = app.actor.items.get(itemId);
                let powerItem = new PowerItem(item);
                let animation = powerItem.animation;
                let animationLabel = animation.name + " ("+ animation.type + ")"
                const labelElement = $(
                    `<div style="font-weight: normal; text-align: center">
                        <b> Animation:</b>${animationLabel}
                    </div><br>`);
                const firstDataContainer = powerSummary.find(".allData .data").first();
                if (firstDataContainer.length > 0) {
                    firstDataContainer.append(labelElement);
                } else {
                    console.warn("Could not find the target .data element for inserting the label.");
                }
            };
        })  
    
        html.find(".reorderDrop[data-type='attaque']").each(async (index, element) => {
            let actor = app.actor    
            const attackId = $(element).find(".editAtk").data("id"); // Get the `data-id` from `.editAtk`
              const attack = Object.values(actor.system.attaque).find(atk => atk._id === attackId);
              if (!attack) return;
              let powerItem = new PowerItem();
              powerItem.attack = attack;
              powerItem.token = actor;    
            const label = powerItem.animation?.name + " ("+ powerItem.animation?.type + ")"
           //   const label = await getAttackLabel(actor, attackData);
              const labelElement = $(`
                  <div class="attack-label-full-row" style="font-size: 0.9em; font-style: ; font-weight: normal; text-align: left; margin-top: -6px; margin-bottom: 8px; padding-left: 10px; width: 100%;">
                      <b>Animation:</b> ${label}
                  </div>
              `);
              $(element).after(labelElement);
        });
    });
    class BaseEffectSection extends Sequencer.BaseSection {
        constructor(inSequence) {
        super(inSequence) 
        this._effect;
        this.sequence = new Sequence();

        this.tokenAnchor = {
            x: 0, 
            y: 0,
            YdistanceTravelled:0,
            XdistanceTravelled:0,
            
            rotation: 0
        };

        this.targets = Array.from(game.user.targets);
        this.tiles = canvas.tiles.placeables;
        this.selecteds = canvas.tokens.controlled
        
        this.firstTemplate = canvas.templates.placeables[0];
        this.firstSelected = canvas.tokens.controlled[0];
        this.firstTile = canvas.tiles.placeables[0];
        this.firstTarget = this.targets[0];
        this.firstTargeted = this.targets[0];
        
        this.caster = this.firstSelected
        this.affected = undefined
        
        this._methodLog = [];
    }

    on(inObject) {
        this.logMethodCall('on', inObject);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.on(inObject);
        return this;
    } 

    initalizeMiddleAndEndDistance(position){
        this.tokenCenter = {
            x: this.caster.x + canvas.grid.size/2,
            y: this.caster.y + canvas.grid.size/2,
            };  
              
         this.middlePoint = {
            x: (this.tokenCenter.x + position.x) / 2,
            y: ((this.tokenCenter.y + position.y) / 2)- canvas.grid.size*1.5,
            };
            
        this.middleDistance = Math.sqrt((this.middlePoint.x - this.tokenCenter.x ) ** 2 + (this.middlePoint.y - this.tokenCenter.y ) ** 2); 
        this.endDistance = Math.sqrt((position.x - this.middlePoint.x ) ** 2 + (position.y - this.middlePoint.y ) ** 2);  
    }
    initalizeRandomNumbers(){
        this.num = Math.floor(Math.random() * 2);
        this.mirroredX;
        this.mirroredY;
        if (Math.random() >= 0.5) {
        this.mirroredX = true;
        } else {
        this.mirroredX = false;
        }
        const minYOffset = -10; // Minimum offset
        const maxYOffset = 10; // Maximum offset
        this.randomYOffset = Math.random() * (maxYOffset - minYOffset) + minYOffset;
    }
    initializeTemplateVariables(){
        
        this.initalizeRandomNumbers()
        let  startOffsetDistance = -0.5; // Adjust this value as needed
        this.templateCenter = {x:this.affected.center.x , y:this.affected.center.y}
        if(this.affected.ray)
        {
            this.templateCenter = {x: (this.affected.ray.A.x + this.affected.ray.B.x)/2, y: (this.affected.ray.A.y + this.affected.ray.B.y)/2}
            startOffsetDistance=0;
        }
        
        const dx = this.affected.center.x - this.caster.center.x;
        const dy = this.affected.center.y - this.caster.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const offsetStartX = (dx / distance) * startOffsetDistance;
        const offsetStartY = (dy / distance) * startOffsetDistance;

        this.start = {x: this.caster.center.x + offsetStartX, y:this.caster.center.y + offsetStartY};
        this.end={ x: this.affected.x + this.affected.width, y: this.affected.y + this.affected.height };
        this.templateStart = { x: this.affected.x, y: this.affected.y };
    }

    /* static accessors for foundry objects---------------------------------------------- */ 
    static get targets() {
        return Array.from(game.user.targets);
    }

    getTokenCenter(token){
        return {
            x: token.x + ( token.width ) / 2,
            y: token.y + (token.height ) / 2
        }
    }

    getNearestTokenSide(start, token){
        let tokenCenter = this.getTokenCenter(token)
        let x = tokenCenter.x - start.x;
        let y = tokenCenter.y - start.y;
        let angle = Math.atan2(y, x) * 180 / Math.PI;
        let side = Math.round((angle + 180) / 90) % 4;
        //return a {x,y} object with the center of the side
        switch (side) {
            case 0:
                return { x: tokenCenter.x, y: token.y };
            case 1:
                return { x: token.x + token.width, y: tokenCenter.y };
            case 2:
                return { x: tokenCenter.x, y: token.y + token.height };
            case 3:
                return { x: token.x, y: tokenCenter.y };
        }
    }
    static get Tiles() {
        return canvas.tiles.placeables;
    }
    static get Selecteds() {
        return canvas.tokens.controlled;
    }
    static get FirstTemplate() {
        return canvas.templates.placeables[0];
    }
    static get FirstSelected() {
        return canvas.tokens.controlled[0];
    }
    static get FirstTile() {
        return canvas.tiles.placeables[0];
    }
    static get FirstTarget() {
        return this.targets[0];
    }

    resistAndStruggle(target = this.affected){
        this.mm3eEffect()
            this.affectCommon(target)
            .hideToken(target)
            .turnRight({token:target, distance:25, duration:300})
            .loopRight({token:target, distance:20,duration:300}) 
            .loopLeft({token:target, distance:10,duration:300})
            .turnLeft({token:target, distance:15, duration:300})
            .turnRight({token:target, distance:35,duration:300}) 
            .turnRight({token:target, distance:20,duration:300}) 
            .moveLeft({token:target, distance:20,duration:300}) 
            .showToken(target)  
        return this;
    }

    logMethodCall(methodName, args) {
        // Convert to array if args is array-like (arguments object), otherwise wrap as an array
        const argsArray = args instanceof Object && args.length !== undefined ? Array.from(args) : [args];
        this._methodLog.push({
            method: methodName,
            args: argsArray
        });
    }

    mm3eEffect() {
        this._methodLog = [];
        this._effect = this._effect ? this._effect : this.effect();
        this._effect = this.effect();
        return this;
    }

    /* commands that are  overridden for each power if an animation is desired*/
    animateProperty(property, sub,{from, to, duration, ease, fromEnd}={}) {
        this.logMethodCall('animateProperty', [property, sub,{from, to, duration, ease, fromEnd}]);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animateProperty(property, sub, {from, to, duration, ease, fromEnd});
        return this;
    }
    affect({caster, affected}={}){
        return this.affectCommon({caster:caster, affected:affected})
    }  
    affectCommon({caster = this.caster || this.firstSelected, affected = this.affected | this.firstTarget}={}){
        if(affected!=0){ //if we passed in a affected
            this.affected = affected
        }
        if(caster!=0){
            this.caster = caster
        }
        
        if(this.affectLocation){
            return this.mm3eEffect().atLocation(this.affectLocation)
        }
        else{
                if(this.affected){
                //   this.atLocation(this.affected)
            }
            
        return this.mm3eEffect()
        .atLocation(this.affected)//.attachTo(this.affected); 
        }
    }

    cone({caster, affected}={}){
        return this.coneCommon({affected:affected})
    }
    coneCommon({caster = this.caster, affected =  this.firstTemplate}={}){   
        if(affected!=0){ //if we passed in a affected
            this.affected = affected
        }
        this.initializeTemplateVariables()
        this.affectLocation = this.templateStart
        this.mm3eEffect()
            .atLocation( this.templateStart)
            .stretchTo(affected)
        return this 
    }

    line({affected}={}){
        return this.lineCommon({affected:affected})
    }
    lineHealing({affected}={}){
        return this.lineCommon({affected:affected})
    }
    lineCommon({affected =  this.firstTemplate}={}){
        return this.coneCommon({affected:affected})
    }

    burst({affected}={}){
        return this.burstCommon({affected:affected})
    }
    burstCommon({affected = this.firstTemplate}={}){
        
        if(!affected==0){
            this.affected = affected
        }
        return this.affectCommon({affected:affected})
    }



    cast({caster , affected}={}){
        return this.castCommon({caster:caster, affected:affected})
    }
    castCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget), rotation = false}={}){
        if(caster!=0)
            this.caster = caster
        if(!caster){
            ui.notifications.error("You must select a token to cast a power!")
            throw new Error("You must select a token to cast a power!")
        }
        if(affected && affected!=0)
            this.affected = affected;
        if(!this.affected) 
        {
            this.affected = this.caster
        }
        this.mm3eEffect()
                this.atLocation(this.caster)
            if(this.affected && this.affected!=this.caster && rotation)
                this.rotateTowards(this.affected)
        return this
    }
    castRange({caster , affected}={}){
        return this.cast({caster:caster, affected:affected})
    }
    cast2({caster , affected}={}){
        return this.cast({caster:caster, affected:affected})
    } 
    affectHealing2({affected = this.firstSelected}={}){
        return this.affectCommon({affected:affected, persist:false})
    }

    castToTemplate({caster =(this.caster)}={}){
        return this.cast({caster:caster, affected:this.firstTemplate})
    }
    meleeCast({caster , affected}={}){
        return this.meleeCastCommon({caster:caster, affected:affected})
    }
    meleeCastCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}={}){
        return this.castCommon({caster:caster, affected:affected, rotation:false})
    }

    project({caster , affected}={}){
        return this.projectCommon({caster:caster, affected:affected})
    }
    projectRange({caster , affected}={}){
        this.projectCommon({caster:caster, affected:affected})
        return this
    } 
    projectRay({caster , affected}={}){
        this.projectCommon({caster:caster, affected:affected})
        return this
    }
    projectChain({ caster = this.firstSelected, affected = Array.from(game.user.targets), } = {}) {
        this.projectCommon({caster:caster, affected:affected})
        return this
    }
        projectChainHealing({ caster = this.firstSelected, affected = Array.from(game.user.targets), } = {}) {
        this.projectCommon({caster:caster, affected:affected})
        return this
    }        
    projectCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}={}){
        this.castCommon({caster:caster, affected:affected,rotation:false})
        let stretchToLocation=affected;
        if(this.affected.constructor.name=="MeasuredTemplate" && this.affected.document?.t=='cone' || this.affected.document?.t=='ray'){
            this.initializeTemplateVariables()
            stretchToLocation = this.templateStart
        }
        if(this.affectLocation){
            stretchToLocation = this.affectLocation
        }
        
            this.stretchTo(stretchToLocation, {
            attachTo: true
        }).spriteOffset({
            x: 30,
            y: 0
        })

        return this; 
    }
    projectToConeCommon({caster = (this.caster || this.firstSelected), affected = ( this.firstTemplate || this.affected)}={}){
        
        this.castCommon({caster:caster, affected:affected,rotation:false})
        this.initializeTemplateVariables()
        this.atLocation(this.caster)
        this.stretchTo(this.templateStart)
        this.affectLocation = this.templateStart
        return this;
    } 
    projectToCone({caster , affected}={}){
        return this.projectToConeCommon({caster:caster, affected:affected})
    }
    projectToLine({caster , affected}={}){
        return this.projectToConeCommon({caster:caster, affected:affected})
    }

    knockDown({affected:affected}){
        this.startMovement(affected)
        .turnLeft({affected:affected, distance:90,  duration:400})  //simpler move api
        .endMovement()
        return this
        
    }    
        
    repeatEffect() {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect = this.effect();
        let cleanLog = [...this._methodLog];
        this._methodLog.forEach( ({method, args}) => {
            if (typeof this[method] === 'function') {
                this[method](...args);
                // args is guaranteed to be an array
            }
        }
        );
        this._methodLog = cleanLog;
        return this;

    }

    shake({target=this.affected, strength=100, rotation=false, duration, fadeOutDuration=0}={}) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animation().on(this.affected).opacity(1).canvasPan().shake({
            duration: duration,
            strength: strength,
            rotation: rotation,
            fadeOutDuration: fadeOutDuration
        })
        return this;
    }

    pauseThenNextEffect(waiting) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.wait(waiting)
        this.repeatEffect()
        return this;
    }
    pause(waiting) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.wait(waiting)
        return this;
    }
    playSound(inSound,repeats = undefined) {
        this.logMethodCall('playSound', inSound);
        this._effect = this._effect ? this._effect : this.effect();
        if(!repeats)
            this._effect.sound(inSound);
        else 
            this._effect.sound(inSound).repeats(repeats.repeats, repeats.duration);
        return this;
    }

    tokenAnimation(token= this.caster){
        this.effected = token;
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animation()//.on(token).opacity(0);
        return this;
    }
    hideToken(token = this.caster)
    {
        this._effect =  this._effect ? this._effect : this.effect();
        this._effect.animation().on(token).opacity(0)
        return this
    }
    showToken(token = this.caster)
    {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animation().on(token).opacity(1)
        return this
    }
    calculateFrontAndCenterPos(distance = 0.25)
    {
        this.affectedCenter = {
            x: this.affected.x+canvas.grid.size*this.affected.document.width/2,
            y: this.affected.y+canvas.grid.size*this.affected.document.width/2,
            };
            
        this.casterCenter = {
        x: this.caster.x+canvas.grid.size*this.affected.document.width/2,
        y: this.caster.y+canvas.grid.size*this.affected.document.width/2,
        };
        
        this.middleposition = {
            x: (this.affected.x - this.caster.x)*distance,
            y: (this.affected.y - this.caster.y)* distance,
        };
        
    }

    lungeTowardTarget({ scale =1, distance =.25, duration= 100, repeats=1}={}){
        this.calculateFrontAndCenterPos(distance)
        
        this._effect = this._effect ? this._effect : this.effect();   
        this._effect.animation()
            .on(this.caster)
            .opacity(0)
            // .wait(1)
            

                
    this._effect.effect()
        .from(this.caster)
        .atLocation(this.caster)
        .mirrorX(this.caster.document.mirrorX)
        .animateProperty("sprite", "position.x", { from: 0, to: this.middleposition.x, duration: duration, ease:"easeOutExpo"})
        .animateProperty("sprite", "position.y", { from: 0, to: this.middleposition.y, duration: duration, ease:"easeOutExpo"})
        .animateProperty("sprite", "position.x", { from: 0, to: -this.middleposition.x, duration: duration, ease:"easeInOutQuad", fromEnd:true})
        .animateProperty("sprite", "position.y", { from: 0, to: -this.middleposition.y, duration: duration, ease:"easeInOutQuad", fromEnd:true})
        .scaleToObject(scale, {considerTokenScale: true})
        .duration(duration*4)  
        .repeats(repeats, duration*4)
    //  .wait(600)  
        
        .wait(duration*4*repeats) 
        
        .animation()
        .on(this.caster)
        .opacity(1)
        
        return this;
    }
    recoilAwayFromSelected({affected = this.affected, distance =.25, duration= 100, repeats=1}={}){
        this.calculateFrontAndCenterPos(distance)
        
        this._effect = this._effect ? this._effect : this.effect();

        this._effect.animation()
            .on(affected)
            .opacity(0)
            
        .effect()
            .from(affected)
            .atLocation(affected)
            .mirrorX(affected.document.mirrorX)
            .animateProperty("sprite", "position.x", { from: 0, to: this.middleposition.x, duration: duration, ease:"easeOutExpo"})
            .animateProperty("sprite", "position.y", { from: 0, to: this.middleposition.y, duration: duration, ease:"easeOutExpo"})
            .animateProperty("sprite", "position.x", { from: 0, to: -this.middleposition.x, duration: duration, ease:"easeInOutQuad", fromEnd:true})
            .animateProperty("sprite", "position.y", { from: 0, to: -this.middleposition.y, duration: duration, ease:"easeInOutQuad", fromEnd:true})
            .scaleToObject(1, {considerTokenScale: true})
            .duration(duration*4)  
            .repeats(repeats, duration*4)
        
            .wait(duration*4*repeats) 
        
            
            .animation()
            .on(affected)
            .opacity(1)
        return this;
    }

    resistAndStruggle(target = this.affected){
        this.mm3eEffect()
            this.affectCommon(target)
            .hideToken(target)
            .turnRight({token:target, distance:25, duration:300})
            .loopRight({token:target, distance:20,duration:300}) 
            .loopLeft({token:target, distance:10,duration:300})
            .turnLeft({token:target, distance:15, duration:300})
            .turnRight({token:target, distance:35,duration:300}) 
            .turnRight({token:target, distance:20,duration:300}) 
            .moveLeft({token:target, distance:20,duration:300}) 
            .showToken(target)  
        return this;
    }

    /*movement helpers --------------------------------------------------------------------------*/
    startMovement() {
        this.tokenAnchor = {
            x: this.affected.document.x,
            y: this.affected.document.y,
            YdistanceTravelled:0,
            XdistanceTravelled:0,
            rotation: this.affected.document.rotation
        }
        this.moving = true;
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.effect().delay(1000).animation().on(this.affected).opacity(0)
        return this;
    }
    endMovement(position) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.thenDo( () => {
            this.affected.document.update({
                rotation: this.affected.document.rotation + this.tokenAnchor.rotation
            });
        })
        if(position){
            this._effect.effect().animation().on(this.affected).teleportTo({
                    x: position.x,
                    y: position.y
                }).opacity(1)
        }
        else{
            this._effect.effect().animation().on(this.affected).opacity(1)
        }
        
        return this;
    }

    turnLeft({token=this.affected, distance=0, duration=0, ease="easeInOutCubic"}={}) {
        return this.turnSprite("left", token, distance, duration, ease)
    }
    turnRight({token=this.affected, distance=0, duration= 0, ease="easeInOutCubic"}={}) {
        return this.turnSprite("right", token, distance, duration, ease)
    }

    turnSprite(direction, token, distance, duration, ease) {
        this._effect = this._effect ? this._effect : this.effect();
        if (direction == "left") {
            distance = distance * -1
        }
        let start = this.tokenAnchor.rotation
        this.tokenAnchor.rotation += distance;
        this._effect.effect().atLocation({
            x: this.tokenAnchor.x + (canvas.grid.size / 2),
            y: this.tokenAnchor.y + (canvas.grid.size / 2)
        }).from(token).animateProperty("sprite", "rotation", {
            from: start,
            to: this.tokenAnchor.rotation,
            duration: duration,
            ease: ease
        }).wait(duration * .8)
        return this;
    } 
    moveLeft({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
        return this.moveSprite(token, "left", distance, duration, ease, speed)
    }
    moveUp({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
        return this.moveSprite(token, "up", distance, duration, ease, speed, pause)
    }
    moveDown({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
        return this.moveSprite(token, "down", distance, duration, ease, speed)
    }
    moveRight({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
        return this.moveSprite(token, "right", distance, duration, ease, speed)
    }

    moveTowardPosition({affected = this.affected, duration=1500, position})
    {
        this.animation()
        .on(affected)
        .duration(duration)
        .moveTowards(position)//, { relativeToCenter: true })
        .waitUntilFinished(0)
        return this
    }

    moveSprite(token, position, distance, duration, ease, speed) {
        this._effect = this._effect ? this._effect : this.effect();

        let moveEffect = this._effect.effect()
        moveEffect.from(token);
        moveEffect.atLocation({
            x: this.tokenAnchor.x + canvas.grid.size / 2,
            y: this.tokenAnchor.y + canvas.grid.size / 2
        })

        if (position == "left" | position == "right")
            this.tokenAnchor.x += distance;
        if (position == "up" | position == "down")
            this.tokenAnchor.y += distance;
        moveEffect.moveTowards({
            x: this.tokenAnchor.x + canvas.grid.size / 2,
            y:this.tokenAnchor.y + canvas.grid.size / 2,
            ease: ease,
            duration: duration,
        }, {
            rotate: false
        }).moveSpeed(speed)

        moveEffect.rotate(-this.tokenAnchor.rotation) 
        moveEffect.wait(duration * .9)
        return this
    }

    float(height)
    {
        this.from(this.affected)
        .attachTo(this.affected, { bindAlpha: false, followRotation: true, locale: true })
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(1)
        .animateProperty("sprite", "position.y", { from: 0, to: -height, duration: 500, ease: "easeOutBack" })
        .loopProperty("sprite", "position.y", { from:-50, to: -(height/2), duration: 500, pingPong: true, delay: 1000 })
        .zIndex(2)
        .persist()
        return this
    }

    land(height){
        this.animateProperty("sprite", "position.y", { from: -height, to: 0, duration: 500, ease: "easeOutBack" })
            
        .thenDo(() => {
            Sequencer.EffectManager.endEffects({ name: "Fly", object: this.affected });
        })
        return this
    }
    loopLeft({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
        return this.loopSprite(token, "left", distance, duration, ease, speed, pause)
    }

    loopRight({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
        return this.loopSprite(token, "right", distance, duration, ease, speed, pause)
    } 

    loopUp({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
        return this.loopSprite(token, "up", distance, duration, ease, speed, pause)
    }

    loopDown({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pingpong=true}={}) {
        return this.loopSprite(token, "down", distance, duration, ease, speed, pingpong)
    }

    loopScaleHeight({token=this.affected, from, to, duration, delay,  ease="easeInOutCubic", pingpong=true}={}) {
        return this.loopScale(token, "scale.y", from, to, duration, delay,ease, pingpong)
    }

    loopScaleWidth({token=this.affected, from, to, duration, delay,  ease="easeInOutCubic", pingpong=true}={}) {
        return this.loopScale(token, "scale.x", from, to, duration, delay, ease, pingpong)
    }

    loopScale(token, property, from, to, duration=0, delay=0, ease,  pingpong=true) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.from(token)
        this._effect.loopProperty("sprite", property, {
            from: from, 
            to: to,
            duration: duration,
        //    ease: ease,
            pingPong: pingpong,
            delay: delay

        })


        return this
    }

    loopSprite(token=this.affected, position, distance, duration, ease, speed, pause=true) {
        let moveProperty
        let start 
        if (position == "left" | position == "right") {
            moveProperty = "position.x"
            start = this.tokenAnchor.XdistanceTravelled
            if (position == "left") {
                
                distance = distance * -1
            }
        }
        if (position == "up" | position == "down") {
            moveProperty = "position.y"
            start = this.tokenAnchor.YdistanceTravelled
            if (position == "up") {
                distance = distance * -1
            }
        }
        this._effect = this._effect ? this._effect : this.effect();

        if(this.tokenAnchor.x==0 && this.tokenAnchor.y==0)
        {
            this.startMovement(token);
        }
        this._effect.effect().from(token).loopProperty("sprite", moveProperty, {
            values: [start, distance],
            duration: duration,
            ease: ease,
            pingPong: true
        })
            /*.atLocation({
            x: this.tokenAnchor.x + canvas.grid.size / 2,
            y: this.tokenAnchor.y + canvas.grid.size / 2
        })*/

        if (position == "left" | position == "right"){
            this.tokenAnchor.x += distance;
            this.tokenAnchor.XdistanceTravelled +=distance
        }
        if (position == "up" | position == "down"){
            this.tokenAnchor.y += distance;
            this.tokenAnchor.YdistanceTravelled +=distance
        }
        if (pause) {
            this._effect.wait(duration * .9)
        }
        return this
    }


    /*effect wrapper methods --------------------------------------------------------------------------*/

    repeats(repeat, iMin=0, iMax=0) {
        this.logMethodCall('repeats', [repeat, iMin, iMax]);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.repeats(repeat,iMin, iMax);
        return this;
    }

    rotation(rotation) {
        this.logMethodCall('rotation', rotation);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.rotation(rotation);
        return this;
    }

    rotate(rotation) {
        this.logMethodCall('rotate', rotation);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.rotate(rotation);
        return this;
    }

    rotateIn(rotation, duration, options) {
        this.logMethodCall('rotateIn', rotation, duration, options);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.rotateIn(rotation, duration, options);
        return this;
    }

    filter(filterName, options) {
        this.logMethodCall('filter', filterName, options);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.filter(filterName, options);
        return this;
    }

    mirrorX(inBool=true) {
        this.logMethodCall('mirrorX', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.mirrorX(inBool);
        return this;
    }

    mirrorY(inBool=true) {
        this.logMethodCall('mirrorY', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        if(!inBool) inBool=true;
        this._effect.mirrorY(inBool);
        return this;
    }

    belowTokens(inBool=true) {
        this.logMethodCall('belowTokens', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.belowTokens(inBool);
        return this;
    }

    aboveLighting(inBool=true) {
        this.logMethodCall('aboveLighting', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.aboveLighting(inBool);
        return this;
    }

    aboveInterface(inBool=true) {
        this.logMethodCall('aboveInterface', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.aboveInterface(inBool);
        return this;
    }

    elevation(inElevation, inOptions) {
        this.logMethodCall('elevation', inElevation, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.elevation(inElevation, inOptions);
        return this;
    }

    playbackRate(inNumber) {
        this.logMethodCall('playbackRate', inNumber);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.playbackRate(inNumber);
        return this;
    }

    persist(inBool=true, inOptions={}) {
        this.logMethodCall('persist', inBool, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.persist(inBool, inOptions);
        return this;
    }

    file(filePath) {
        this.logMethodCall('file', filePath);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.file(filePath);
        return this;
    }

    opacity(inO){
                this.logMethodCall('opacity', inO);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.opacity(inO);
        return this;

    }

    scaleToObject(scale) {
        this.logMethodCall('scaleToObject', scale);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.scaleToObject(scale);
        return this;
    }

    scale(scale) {
        this.logMethodCall('scale', scale);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.scale(scale);
        return this;
    }

    waitUntilFinished(minDelay=0, maxDelay=0) {
        this.logMethodCall('waitUntilFinished', minDelay, maxDelay);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.waitUntilFinished(minDelay, maxDelay);
        return this;
    }

    async(inBool=true) {
        this.logMethodCall('async', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.async(inBool);
        return this;
    }

    playIf(inCondition) {
        this.logMethodCall('playIf', inCondition);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.playIf(inCondition);
        return this;
    }

    delay(inTime) {
        this.logMethodCall('delay', inTime);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.delay(inTime);
        return this;
    }

    volume(inVolume) {
        this.logMethodCall('volume', inVolume);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.volume(inVolume);
        return this;
    }

    fadeInAudio(inDuration) {
        this.logMethodCall('fadeInAudio', inDuration);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.fadeInAudio(inDuration);
        return this;
    }

    fadeOutAudio(inDuration) {
        this.logMethodCall('fadeOutAudio', inDuration);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.fadeOutAudio(inDuration);
        return this;
    }

    opacity(inOpacity) {
        this.logMethodCall('opacity', inOpacity);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.opacity(inOpacity);
        return this;
    }

    fadeIn(inDuration) {
        this.logMethodCall('fadeIn', inDuration);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.fadeIn(inDuration);
        return this;
    }

    fadeOut(inDuration) {
        this.logMethodCall('fadeOut', inDuration);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.fadeOut(inDuration);
        return this;
    }

    duration(inDuration) {
        this.logMethodCall('duration', inDuration);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.duration(inDuration);
        return this;
    }

    startTime(inTime) {
        this.logMethodCall('startTime', inTime);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.startTime(inTime);
        return this;
    }

    startTimePercentage(inPercentage) {
        this.logMethodCall('startTimePercentage', inPercentage);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.startTimePercentage(inPercentage);
        return this;
    }

    endTime(inTime) {
        this.logMethodCall('endTime', inTime);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.endTime(inTime);
        return this;
    }

    noLoop(inBool=true) {
        this.logMethodCall('noLoop', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.noLoop(inBool);
        return this;
    }

    endTimePercentage(inPercentage) {
        this.logMethodCall('endTimePercentage', inPercentage);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.endTimePercentage(inPercentage);
        return this;
    }

    timeRange(inStartTime, inEndTime) {
        this.logMethodCall('timeRange', inStartTime, inEndTime);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.timeRange(inStartTime, inEndTime);
        return this;
    }

    locally(inBool=true) {
        this.logMethodCall('locally', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.locally(inBool);
        return this;
    }

    forUsers(inUsers) {
        this.logMethodCall('forUsers', inUsers);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.forUsers(inUsers);
        return this;
    }

    baseFolder(inFolder) {
        this.logMethodCall('baseFolder', inFolder);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.baseFolder(inFolder);
        return this;
    }

    from(inObject) {
        this.logMethodCall('from', inObject);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.from(inObject);
        return this;
    }

    atLocation(inLocation) {
        this.logMethodCall('atLocation', inLocation);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.atLocation(inLocation);
        return this;
    }

    attachTo(inObject, inOptions={}) {
        this.logMethodCall('attachTo', inObject, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.attachTo(inObject, inOptions);
        return this;
    }

    rotateTowards(inLocation) {
        this.logMethodCall('rotateTowards', inLocation);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.rotateTowards(inLocation);
        return this;
    }

    stretchTo(inLocation, inOptions={}) {
        this.logMethodCall('stretchTo', inLocation, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.stretchTo(inLocation, inOptions);
        return this;
    }

    moveTowards(inTarget, inOptions={}) {
        this.logMethodCall('moveTowards', inTarget, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.moveTowards(inTarget, inOptions);
        return this;
    }

    moveSpeed(inSpeed) {
        this.logMethodCall('moveSpeed', inSpeed);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.moveSpeed(inSpeed);
        return this;
    }

    snapToGrid(inBool=true) {
        this.logMethodCall('snapToGrid', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.snapToGrid(inBool);
        return this;
    }

    spriteOffset(inOffset, inOptions={}) {
        this.logMethodCall('spriteOffset', inOffset, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.spriteOffset(inOffset, inOptions);
        return this;
    }

    offset(inOffset, inOptions={}) {
        this.logMethodCall('offset', inOffset, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.offset(inOffset, inOptions);
        return this;
    }

    randomSpriteRotation(inBool=true) {
        this.logMethodCall('randomSpriteRotation', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.randomSpriteRotation(inBool);
        return this;
    }

    zeroSpriteRotation(inBool=true) {
        this.logMethodCall('zeroSpriteRotation', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.zeroSpriteRotation(inBool);
        return this;
    }

    extraEndDuration(inExtraDuration) {
        this.logMethodCall('extraEndDuration', inExtraDuration);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.extraEndDuration(inExtraDuration);
        return this;
    }

    loopOptions(inOptions={}) {
        this.logMethodCall('loopOptions', inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.loopOptions(inOptions);
        return this;
    }

    origin(inObject) {
        this.logMethodCall('origin', inObject);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.origin(inObject);
        return this;
    }

    name(inName) {
        this.logMethodCall('name', inName);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.name(inName);
        return this;
    }

    private(inBool=true) {
        this.logMethodCall('private', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.private(inBool);
        return this;
    }

    missed(inBool=true) {
        this.logMethodCall('missed', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.missed(inBool);
        return this;
    }

    addOverride(inFunc) {
        this.logMethodCall('addOverride', inFunc);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.addOverride(inFunc);
        return this;
    }

    size(inSize) {
        this.logMethodCall('size', inSize);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.size(inSize);
        return this;
    }
    spriteRotation(spriteRotation) {
        this.logMethodCall('spriteRotation', spriteRotation);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.spriteRotation(spriteRotation);
        return this;
    }



    affected(inTemplate) {
        this.logMethodCall('template', inTemplate);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.template(inTemplate);
        return this;
    }

    scale(inScale) {
        this.logMethodCall('scale', inScale);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.scale(inScale);
        return this;
    }

    scaleIn(start, finish, options) {
        this.logMethodCall('scaleIn', [start, finish, options]);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.scaleIn(start, finish, options);
        return this;
    }

    scaleOut(start, finish, options) {
        this.logMethodCall('scaleOut', [start, finish, options]);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.scaleOut(start, finish, options);
        return this;
    }

    spriteScale(inScale) {
        this.logMethodCall('spriteScale', inScale);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.spriteScale(inScale);
        return this;
    }

    anchor(inAnchor) {
        this.logMethodCall('anchor', inAnchor);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.anchor(inAnchor);
        return this;
    }

    spriteAnchor(inAnchor) {
        this.logMethodCall('spriteAnchor', inAnchor);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.spriteAnchor(inAnchor);
        return this;
    }

    center() {
        this.logMethodCall('center');
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.center();
        return this;
    }

    randomizeMirror(inBool=true) {
        this.logMethodCall('randomizeMirror', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.randomizeMirror(inBool);
        return this;
    }

    playbackRate(inRate) {
        this.logMethodCall('playbackRate', inRate);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.playbackRate(inRate);
        return this;
    }

    belowTiles(inBool=true) {
        this.logMethodCall('belowTiles', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.belowTiles(inBool);
        return this;
    }

    screenSpace(inBool=true) {
        this.logMethodCall('screenSpace', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.screenSpace(inBool);
        return this;
    }

    screenSpaceAboveUI(inBool=true) {
        this.logMethodCall('screenSpaceAboveUI', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.screenSpaceAboveUI(inBool);
        return this;
    }

    text(inText) {
        this.logMethodCall('text', inText);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.text(inText);
        return this;
    }

    shape(inShape, inOptions={}) {
        this.logMethodCall('shape', inShape, inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.shape(inShape, inOptions);
        return this;
    }

    xray(inBool=true) {
        this.logMethodCall('xray', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.xray(inBool);
        return this;
    }

    mask(inObject) {
        this.logMethodCall('mask', inObject);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.mask(inObject);
        return this;
    }

    tieToDocuments(inDocuments) {
        this.logMethodCall('tieToDocuments', inDocuments);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.tieToDocuments(inDocuments);
        return this;
    }

    syncGroup(inString) {
        this.logMethodCall('syncGroup', inString);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.syncGroup(inString);
        return this;
    }

    zIndex(inIndex) {
        this.logMethodCall('zIndex', inIndex);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.zIndex(inIndex);
        return this;
    }

    sortLayer(inLayer) {
        this.logMethodCall('sortLayer', inLayer);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.sortLayer(inLayer);
        return this;
    }

    tint(inColor) {
        this.logMethodCall('tint', inColor);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.tint(inColor);
        return this;
    }

    screenSpaceScale(inOptions) {
        this.logMethodCall('screenSpaceScale', inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.screenSpaceScale(inOptions);
        return this;
    }

    screenSpacePosition(inPosition) {
        this.logMethodCall('screenSpacePosition', inPosition);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.screenSpacePosition(inPosition);
        return this;
    }

    isometric(inOptions={}) {
        this.logMethodCall('isometric', inOptions);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.isometric(inOptions);
        return this;
    }

    randomRotation()
    {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.randomRotation();
        return this;
    }

    //wrap --> .loopProperty("sprite", "scale.y", {  from:1 ,to:1.5, duration: 500, pingPong: true, delay:0})
    loopProperty(property, key, options) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.loopProperty(property, key, options);
        return this;
    }

    //wrap -->.teleportTo(position)
    teleportTo(position, token = this.effected) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animation().on(token).teleportTo(position).snapToGrid();
        return this;    
    }

    //wrap thenDO --> .thenDo( () => {console.log("hello")})
    tokenThenDo(func) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.thenDo(func);
        return this;
    }

    randomizeMirrorY(inBool=true) {
        this.logMethodCall('randomizeMirrorY', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.randomizeMirrorY(inBool);
        return this;
    }

    randomizeMirrorX(inBool=true) {
        this.logMethodCall('randomizeMirrorX', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.randomizeMirrorX(inBool);
        return this;
    }
    }
    class PowerEffectSection extends BaseEffectSection {
        constructor(inSequence) {
            super(inSequence);
            this.leaves = 'orangepink'
        }
        static async placeCreationTile({animation='animated-spell-effects-cartoon.energy.01', tint="#745002"}={}){
            let creationTile = await GameHelper.placeCreationTile({power: this.getClass().getName(), animation:animation, tint:tint, height:300, width:300}) 
        }
        affectAffliction({affected = this.affected}={}){
            return this.affectCommon({affected:affected})
            .affliction()
        }
        affliction(){
            return this.file('jb2a.condition.curse')
            .scaleToObject(2)
            .persist(true)
            .playSound('modules/mm3e-animations/sounds/Spells/Debuff/spell-*.mp3')
        } 

        affectAura({affected = this.affected}={}){
            return this.affectCommon({affected:affected})
            .aura()
        }
        aura(){
            return this.file('jb2a.template_circle.aura.01.complete.small.yellow')
            .scaleToObject(2)
            .persist(true)
        }

        affectBurrowing({caster, position}={}) {
            this.affectCommon({affected:affected})
            return this.burrowing({position:position})
        }
        burrowing({position:position}={}){
            if(!position){
                throw new Error("Position is required for burrow")
            }
            this.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            this.canvasPan()
                .delay(200)
                .shake({ duration: 800, strength: 5, rotation: false })
                .canvasPan()
                .delay(1000)
                .shake({ duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
            this.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)
                .pause(100)
            this.animation()
                .on(this.affected)
                .teleportTo(position)
                .delay(1000)
                .snapToGrid()
                .fadeOut(50)
                .fadeIn(50)
                .offset({ x: -1, y: -1 })
            //     .pause(1000)
                .waitUntilFinished(100)
            this.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
                .pause(100)
            .animation()
                .delay(1000)
                .on(this.caster)
                .fadeIn(200)
            //      .pause(500)
            this.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .atLocation(position, {offset: {y: -0}, gridUnits: true})
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            this.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .atLocation(position)
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1)
            this.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .atLocation(position)
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)
        }
            affectConcealment({affected = (this.affected|this.firstSelected),filter= GameHelper.whiteColorFilter}= {}){
                
            return this.affectCommon({affected:affected})
                .scaleToObject(1.5)
                .file("jb2a.shimmer.01.blue")
                .filter(filter.filterType, filter.values)
                .playSound('modules/mm3e-animations/sounds/action/powers/invisible1.ogg')
                .thenDo( ()=>{
                    this.affected.document.update({ "alpha": 
                        0.1 });
                })   
            
        }

        affectConcealment2({affected = (this.affected|this.firstSelected),filter= GameHelper.whiteColorFilter}= {}){

            return this.affectCommon({affected:affected})
        }

        affectCreate({affected}={}){
        super.affectCommon({affected:affected})
        return this
        }
        create(){ 
        return this
        }

        affectDamage({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            return this.damage()
        }
        damage(){
            return this.file('animated-spell-effects-cartoon.energy.flash')
            .scaleToObject(1)
            .playSound('modules/mm3e-animations/sounds/Combat/Melee%20Natural/melee-hit-1.mp3')
        } 

        affectDazzle({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            return this.dazzle()
        }
        dazzle(){ 
            for (let i = 0; i < 10; i++) {
                let randomOffset = () => ({
                    x: Math.floor(Math.random() * 100) - 50, // Random value between -50 and 50
                    y: -50 + Math.floor(Math.random() * 100) - 50  // Random value between -50 and 50
                }); 
                this.affectCommon().file('animated-spell-effects-cartoon.energy.flash')
                .scaleToObject(1)
                .spriteOffset(randomOffset())
                .playSound('modules/mm3e-animations/sounds/hazards/electricity/Electric_Spark_01.ogg')
                .pause(50)
            }
            
            return this;
        }

        affectDeflection({affected = this.affected}={})
        {
            this.affectCommon({affected:affected})
            this.deflectionAnimation ="jb2a.bullet.Snipe"
            return this.deflection()
        }
        deflection(){
            this.randomDeflectionX = Math.random() * (1000 - -1000) + 100; // Random X coordinate between 0 and 1000
            this.randomDeflectionY = Math.random() * (1000 - -1000) + 100; // Random Y coordinate between 0 and 1000
            this.randomDeflectionEndX = Math.random() * (1000 - -500) + 100; // Random X coordinate between 0 and 1000
            this.randomDeflectionEndY = Math.random() * (1000 - -500) + 100; // Random Y coordinate between 0 and 1000
            this.affectCommon()
            .file(this.deflectionAnimation)
            .atLocation({ x: this.randomDeflectionX, y: this.randomDeflectionY }) // Set the randomized starting point
            .stretchTo(this.affected)
            .fadeIn(500)
            .fadeOut(500)
            .delay(1300)
        .affectCommon()
            .effect()
            .file(this.deflectionAnimation)
            .atLocation(this.affected) // Set the starting point to the token's position
            .stretchTo({ x: this.randomDeflectionEndX, y: this.randomDeflectionEndY }) // Stretch to the randomized end point
            .fadeIn(500)
            .fadeOut(500)
            .delay(1300)
            .playbackRate(0.5);
            return this
        }

        affectElementalControl({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            return this.elementalControl()
        }
        elementalControl(){
            return this
        }

        affectElongation({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            return this.elongation()
        }
        elongation(){
            return this
        }

        affectEnvironmental({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            return this.environmentalControl()
        }
        environmental(){
            return this
        }

        castFlight({affected = this.affected, position}={}) {
            this.affectCommon({affected:affected})
            return this.startFlight({position:position})
        }

        affectFlight({affected = this.affected, position}={}){
            this.affectCommon({affected:affected})
            return this.endFlight({position:position})
        }
        startFlight({position}={}){
            this.name("Fly")
            .startMovement()
            .float(50)
            //  this.endFlight(position)
            return this
        }

        endFlight({position:position}={}){
            this.moveTowardPosition({position:position, duration: 2500})
            .land(50)
            .endMovement(position)
            return this
        }
        affectHealing({affected = this.firstSelected}={}){

            this.affectCommon({affected:affected})
            .healing()
            return this;
        }
        healing(){
            this.file('jb2a.healing_generic.200px.yellow02')
            .playSound('modules/mm3e-animations/sounds/Spells/Buff/spell-buff-long-3.mp3')
            return this;
        }

        affectHealing2({affected = this.firstSelected}={}){

            this.affectCommon({affected:affected})
            .healing()
            return this;
        }


        affectIllusion({affected = this.affected}={})
        {
            this. affectCommon({affected:affected})
            .illusion()
            return this;
        }
        illusion(){
            return this .file('jb2a.markers.stun.dark_teal.02')
            .filter("ColorMatrix", { saturate: 0, brightness:.5 , hue: 200  })
            .scaleToObject(1)
            .spriteOffset({x:0, y:-25})
            .belowTokens(true)
            .persist(true)
            .playSound('modules/mm3e-animations/sounds/action/powers/Seers_AuraVoicesL_Loop.ogg')
            return this
        }

        affectImmunity({affected = this.affected}={}){
            return this.affectCommon({affected:affected})
            .immunity()
        }
        immunity(){
            return this.affectAura()
        }

        affectInsubstantial({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .insubstantial()
        }

        insubstantial(){
            let currentAlpha = this.affected.document.alpha;
            if (currentAlpha != 1) {
                setTimeout(async () => {
                    await this.affected.document.update({ alpha: 1 });
                }, 3000); // Delay of 1000 milliseconds (1 second)
            } else {
                setTimeout(async () => {
                    await this.affected.document.update({ alpha: 0.5 });
                }, 3000); // Delay of 1000 milliseconds (1 second)
            }
        }

        
        affectLeaping({affected = this.affected, position}={}){
            this.affectCommon({affected:affected})
            return this.leaping({position:position})
        }

        leaping({ position, height=2.5}={}){
                super.mm3eEffect() //shadow
                .from(this.caster)
                .opacity(0.5)
                .scale(0.9)
                .belowTokens()
                .duration(1000)
                .anchor({ x: 0.5, y: 0.5 })
                .filter("ColorMatrix", { brightness: -1 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .moveTowards(position, {rotate:false})
            this.mm3eEffect() //leap
                .startMovement()
                .attachTo(this.affected, { bindAlpha: false, followRotation: true, locale: true })
                .opacity(1)
                .duration(1000)
                .loopScaleHeight({from:1,to:height, duration: 500, pingPong: true, delay:0})
                .loopScaleWidth({from:1,to:height, duration: 500, pingPong: true, delay:0})
                this.moveTowardPosition({position:position, duration: 1000})
                this.endMovement(position)
        return this
        }


        affectMindControl({affected = this.affected}={})
        { 
            return this.affectCommon({affected:affected})
            .mindControl()
        }
        mindControl(){
            this.file("jaamod.spells_effects.confusion")
            .scaleToObject(.8)
            .spriteOffset({x:0, y:-45})
            .belowTokens()
            .opacity(0.5) 
            .filter( "ColorMatrix",
                {
                    hue: 50, 
                    contrast: 1, 
                    saturate: 0, 
                    brightness: 3 
            })
            .persist()
            .playSound('modules/mm3e-animations/sounds/action/powers/Seers_SootheMind_Hit.ogg')
            return this;
        }

        affectNullify({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .nullify()
            
        }
        nullify(){
            return this.file("jb2a.condition.curse.01.012")
            .playSound('modules/mm3e-animations/sounds/Spells/Debuff/spell-decrescendo-short-1.mp3')
        }

        affectProtection({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .protection()
        }
        protection(){
            this.file("jb2a.shield")
            .persist( true)
            .playSound('modules/mm3e-animations/sounds/action/powers/ForcefieldOn.ogg')
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/ForceField*_loop.ogg')
        }

        static async placeSummonedActor({actor }={}){
            let creationTile = await GameHelper.placeSummonedActor({actor}) 
        }

        affectRegeneration({affected = this.affected}={}){
            return this.affectCommon({affected:affected})
            .regeneration()
        }
        regeneration(){
            this.affectHealing()
        }

        affectSenses({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .senses()
        }
        senses(){
            return this.file("jb2a.eyes.01")
        }

        affectSpeed({affected = this.affected, position}={}){
            return this.affectCommon({affected:affected})
            .speed({position:position})
        }
        speed({position}={}){
            if(!position){
                throw new Error("Position is required for speed")
            }
            this.castCommon({caster:this.caster, affected:this.affected})
            .animation()
                .on(this.caster)
                .fadeOut(0)
                .waitUntilFinished()
            this.castCommon()
                .file(this.caster.document.texture.src) 
                .scale(this.caster.document.texture.scaleX) 
                .opacity(1) 
                .from(this.caster)
                .moveSpeed(1000)
                .moveTowards(position, { ease: "easeInOutCubic", rotate: true })
                .duration(300) 
                .wait(100)
            
            this.descriptorSpeed(position)

            .animation()
                .on(this.caster)
                .teleportTo(position)
                .snapToGrid()
                .offset({ x: -1, y: -1 })
          //      .waitUntilFinished(-800) 
        
            .animation()
                .on(this.caster)
                //  .fadeIn(100)
                .opacity(1)
          //      .waitUntilFinished(-800)

            return this

        }

        affectSnare({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .snare()
        }
        snare(){
             this.file("jaamod.traps.trap_net_dark")
                .playSound('modules/mm3e-animations/sounds/action/behavior/Dance_Cloth_05.ogg')
                .scaleToObject(1.5)
                this.pause(2500)
            return this.affectCommon()
                .file("jaamod.traps.trap_net_dark")
                .timeRange(2200,4000) 
                .scaleToObject(1.5)
                .persist(true)
                .pause(1000)
                .resistAndStruggle()
                
                

        }



        affectTeleport({affected = this.affected, position=0}={}){
            return this.affectCommon({affected:affected})
            .teleport({caster:affected, position:position})
        }
        teleport({caster:caster, position}={}){
                if(!position){
                throw new Error("Position is required for teleport")
            }
                let hue = -0
                let saturate = 0
                let tint = "#dc7118"
            super.castCommon({caster:caster, affected:caster})
            .animation()
                .on(this.caster)
                .teleportTo(position)
                .snapToGrid()
                .fadeOut(50)
                .fadeIn(50)
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(100)

            super.castCommon()
                .file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
                .scaleToObject(2.25)
                .fadeOut(300)
                .filter("ColorMatrix", { saturate: saturate })
                .animateProperty("sprite", "width", { from: caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "height", { from: caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "width", { from: 0, to: caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .animateProperty("sprite", "height", { from: 0, to: caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .playbackRate(2)
                .belowTokens()
                .tint(tint)
            .pause(1000)

            .animation().on(this.caster).opacity(1)
            return this
        }

        affectTransform({affected = this.affected, image=this.getClass().getName()+'.webm'}={})
        {
                this.affectCommon({affected:affected})
                //update the token image
            this.transform(image)
                return this;
        }
        transform(image)
        {
            
           if(!image)
            {
                image = this.constructor.name.replace('Section','')
                image = image.charAt(0).toLowerCase() + image.slice(1);
                image = 'modules/mm3e-animations/tiles/'+ image +'.webm'
            }
            this.file(image)
            .atLocation(this.affected)
            .scaleToObject(1)
            this.hideToken(this.affected)
            .persist() 
            //this.thenDo(()=> this.affected.document.update({ "texture.src": image }))
        }


        swing({caster:caste,positin}={}){
            if(!caster){
                throw new Error("Caster is required for swing")
            }
        }


        affectSwimming({affected = this.affected, position}={}){
            return this.affectCommon({affected:affected})
            .swimming({position:position})
        }

        swimming({position}={}){
            return this
        }

        

        affectWeaken({affected = (this.affected|this.firstSelected)}={}){
            this.affectCommon({affected:affected})
            return this.weaken(affected)
        }
        weaken(affected){
            let tintColor = '#808080'
            let hue = 350

            this.calculateFrontAndCenterPos(this.affected, this.affected.document.width/2)
            this.affectCommon({affected:this.affected})
                .from(this.affected)
                .attachTo(this.affected)
                .filter("ColorMatrix", { saturate:-1})
                .scaleToObject(1, {considerTokenScale: true})
                .persist()
                .fadeIn(3000)       
            .affectCommon()
                .delay(150)
                .file("jb2a.impact.004.green")
                .rotateTowards(this.caster)
                .scaleToObject(1.45)
                .spriteScale({ x: 0.75, y: 1.0 })
                .filter("ColorMatrix", { saturate: 0, brightness:0.2 , hue: hue })
                .spriteOffset({ x: -0.15 }, { gridUnits: true })
                .zIndex(2)
            
            .affectCommon()
                .file("jb2a.impact.ground_crack.02.white")
                .rotateTowards(this.caster)
                .spriteOffset({x:-0.4}, {gridUnits:true})
                .filter("ColorMatrix", { saturate:0, brightness:1.5 })
                .size(this.caster.document.width*1.5, {gridUnits:true})
                .tint(tintColor)
                .mask(this.affected)
                .zIndex(1)

            .affectCommon()
                .file("jb2a.extras.tmfx.outflow.circle.01")
                .attachTo(this.affected)
                .filter("ColorMatrix", { brightness: 0, saturate:-1})
                .scaleToObject(1.45, {considerTokenScale: true})
                .fadeIn(3000)
                .fadeOut(1000)
                .belowTokens()
                .duration(5000)

            .affectCommon()
                .file("jb2a.impact.ground_crack.still_frame.02")
                .atLocation(this.affected)
                .rotateTowards(this.caster)
                .spriteOffset({x:-0.4}, {gridUnits:true})
                .filter("ColorMatrix", { saturate:0, brightness:0 })
                .filter("Glow", { outerStrength: 6, distance:10, color: 0x000000 })
                .size(this.affected.document.width*1.5, {gridUnits:true})
                .fadeIn(2000)
                .fadeOut(1000)
                .duration(5000)
                .tint(tintColor)
                .mask(this.affected)
                .zIndex(0)
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/Seers_RevealWeakness_Attack.ogg')
            return this;
        }

        
    }
    class TemplatedDescriptorEffect extends PowerEffectSection{
        constructor(inSequence) {
            super(inSequence);
        }
        cast({caster, affected,rotation=false}={}){
            super.castCommon({caster:caster, affected:affected, rotation:false})
            this.descriptorCast()
            return this
        }
        descriptorCast(){
            return this
        }
        castBurrowing({caster, affected,position}={}) {
            super.castCommon({caster:caster, affected:affected})
            return this.descriptorCastBurrowing(position)
        }
        castFlight({caster, affected,position}={}) {
            super.castCommon({caster:caster, affected:affected})
            return this.descriptorCastFlight(position)
        }
        castLeaping({caster, affected,position}={}){
            super.castCommon({caster:caster, affected:affected})
            return this.descriptorCastLeaping(position)
        }
        castSpeed({caster, affected,position}={}){
            super.castCommon({caster:caster, affected:affected})
            return this.descriptorCastSpeed(position)
        }
        castTeleport({caster, affected,position}={}){
            super.castCommon({caster:caster, affected:affected})
            return this.descriptorCastTeleport(position)
        }
        meleeCast({caster, affected}={}){
            super.castCommon({caster:caster, affected:affected, rotation:false})
            this.descriptorMeleeCast()
            .lungeTowardTarget()
            .castCommon()
            super.shake({duration: 500, strength: 90, rotation: false })
            return this
        }

        project({caster, affected}={}){
            super.projectCommon({caster:caster, affected:affected})
            this.descriptorProject()
            return this
        }
        projectToCone({caster, affected}={}){
            super.projectToConeCommon()
            this.descriptorProjectToCone()
            return this
        }  
        projectToLine({caster, affected}={}){
            super.projectToConeCommon()
            this.descriptorProjectToLine()
            return this
        }
        projectToBurst({caster, affected}={}){
            super.projectCommon()
            this.descriptorProjectToBurst()
            return this
        }

        burst({affected}={}){
            super.burstCommon({affected:affected})
            this.descriptorBurst()
            return this
        }
        line({affected}={}){
            super.lineCommon({affected:affected})
            this.descriptorLine()
            return this
        }
        cone({affected}={}){
            super.coneCommon({affected:affected})
            this.descriptorCone()
            return this
        }

        affect({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorAffect()
            return this;
        }
        affectAura({affected = this.affected|| this.firstSelected, persist}={}){
            super.affectCommon({affected:affected})
            .pause(1000)
            this.descriptorAura()
            return this
        }
        descriptorAffect(){ // override for common affect logic in descriptior
            return this
        }
        descriptorAura(){  
            return this;
        }
        affectAffliction({affected}={}){
            super.affectCommon({affected:affected})
            .descriptorAffect()
            .descriptorAffliction()
            return this
        }
        descriptorAffliction(){ //optionally override for custom sequence effect 
            super.affliction({affected:this.affected})
            return this
        }

        affectBurrowing({affected, position}={}){
            super.affectCommon({affected:affected})
            super.burrowing({caster:this.affected, position:position})
            this.descriptorBurrowing(position)
            this.affectAura({affected:this.caster})
                return this
        }
        descriptorBurrowing(){
            return this
        }

        affectDazzle({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorDazzle()
            return this
        }
        descriptorDazzle(){
            return this
        }

        affectEnvironment({affected}={}){
        super.affectCommon({affected:affected})
        this.descriptorEnvironment()
        return this
        }
        descriptorEnvironment(){
            return super.environment()
        }
        affectCreate({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorAffect()
            this.descriptorCreate()
            return this
        }
        descriptorCreate(){ //optionally override for custom sequence effect
            super.create({affected:this.affected})
            return this
        }
        affectDeflection({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorAffect()
            this.descriptorDeflection();
            super.deflection();
            return this
        }  
        descriptorDeflection(){
            
            return this
        }
        affectConcealment({affected}={})
        {
            super.affectCommon({affected:affected})
            super.affectConcealment({affected:this.affected})
            this.affectAura({affected:affected, persist:true})
            return this;
        }
        descriptorConcealment(){
            super.concealment({affected:this.affected})
            return this;
        }
        affectDamage({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorAffect()
            this.descriptorDamage()
            return this
        }
        descriptorDamage(){
            super.damage({affected:this.affected})
            return this
        }
        affectElongation({affected, position}={}) {
        super.affectCommon({affected:affected})
        this.descriptorElongation()
        return this
        }
        descriptorElongation(){
        return super.elongation({affected:this.affected})
        }
        affectFlight({affected, position}={}){
            super.affectCommon({affected:affected})
            super.startFlight({position:position})
            super.endFlight({position:position})
                super.affectCommon({affected:affected})
            this.descriptorFlight(position)
            return this
        }
        descriptorFlight(position){
            return this
        }
       
        affectHealing({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorHealing()
            this.affectAura({affected:affected})
            return this
        }
        descriptorHealing(){
            super.healing({affected:this.affected})
            return this
        }
        affectIllusion({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorIllusion()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorIllusion(){
            super.illusion({affected:this.affected})
            return this
        }
        affectImmunity({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorImmunity()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorImmunity(){
            return super.immunity()
        }
        affectInsubstantial({affected}={}){
            super.affectCommon({affected:affected})
            super.insubstantial({affected:this.affected})
            this.descriptorInsubstantial()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorInsubstantial(){
            return this
        }
        descriptorLeaping(position){
                return this
        }
        affectLeaping({affected, position, height}={}){
            super.affectCommon({affected:affected})
            super.leaping({caster:this.affected, position:position})
            this.descriptorLeaping(position)
            this.affectAura({affected:this.caster})
                return this
        }
        affectMindControl({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorMindControl()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorMindControl(){
            super.mindControl({affected:this.affected})
            return this
        }
        affectMoveObject({affected}={}){
            super.affect({affected:affected})
            super.affectMoveObject({affected:this.affected})
            return this
        }
        
        affectNullify({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorNullify()
            this.affectAura({affected:affected})
            return this
        }
        descriptorNullify(){
            super.nullify({affected:this.affected})
            return this
        }

        affectProtection({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorProtection()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorProtection(){
            super.protection({affected:this.affected})
            return this
        }

        affectRegeneration({affected:affected}={}){
            super.affectCommon({affected:affected})
            this.affectAura({affected:affected, persist:true})
            this.descriptorRegeneration()
            return this
        }
        descriptorRegeneration(){
            super.regeneration({affected:this.affected})
            return this
        }
        affectSenses({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorSenses()
            return this;
        }
        descriptorSenses(){
            return super.senses({affected:this.affected})
        }

        affectSummon({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorSummon()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorSummon(){
            super.summon({affected:this.affected})
            return this
        }

        affectSnare({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorSnare()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorSnare(){
            super.snare({affected:this.affected})
        }
        affectSpeed({affected, position}={}){
            super.affectCommon({affected:affected})
            super.speed({ position:position})
         //   this.descriptorSpeed(position)
            this.affectAura({affected:this.caster})
            return this
        }
        descriptorSpeed(position){
            return this
        }
        affectSwimming({affected,position}={}){
            super.affectCommon({affected:affected})
            super.swimming({affected:this.affected})
            this.descriptorSwimming(position)
        }
        descriptorSwimming(position){
            return super.swimming()
        }
        affectTeleport({affected, position}={}){
            super.affectCommon({affected:affected})
            super.teleport({caster:this.affected, position:position})
            this.descriptorTeleport(position)
            this.affectAura({affected:this.caster})
            return this
        }
        descriptorTeleport(position){
            return this
        }
        affectTransform({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorTransform()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorTransform(){
            super.transform()
            return this
        }
        affectWeaken({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorWeaken()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorWeaken(){
            super.weaken({affected:this.affected})
            return this
        }

        leaping({caster, position, height}={}){
            this.cast({caster:caster})
            super.leaping({caster:this.caster, position:position, height:height})
            this.affect({affected:this.caster})
            return this
        }



        speed({caster,position}={}){
            this.cast({caster:caster})
            super.speed({caster:this.caste,position:position})
            return this
        }

        

        swinging({caster}={}){
            this.cast({caster:caster})
            super.swing({caster:this.caster})
            this.affectAura({affected:this.caster})
            return this
        }

        teleport({caster}={}){
            this.cast({caster:caster})
            super.teleport({caster:this.caster})
            this.affectAura({affected:this.caster})
            return this
        }
        
        // descriptor-personal-swimming
        // descriptor-personal-leaping
        // descriptor-personal-flight
        // descriptor-personal-swinging
        // descriptor-personal-flight
        // descriptor-personal-speed
        // descriptor-personal-teleport

        // descriptor-personal-concealment
        // descriptor-personal-deflect
        // descriptor-personal-growth
        // descriptor-personal-regeneration
        // descriptor-personal-Insubstantiality
        // descriptor-personal-morph
        // descriptor-personal-protection
        // descriptor-personal-quickness
        // descriptor-personal-sense
        // descriptor-personal-remote senses
        // descriptor-personal-shrinking

        
    }
    class ExampleEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class NoDescriptorEffectSection extends TemplatedDescriptorEffect {
            constructor(inSequence) {
                super(inSequence);
            }
            descriptorCast(){
                return this
            }

            descriptorMeleeCast(){
                return this
            }

            descriptorProject(){
                return this
            }

            descriptorProjectToCone(){
                return this
            }

            descriptorProjectToLine(){
                return this
            }

            descriptorBurst(){
                return this
            }

            descriptorLine(){
                return this
            }   

            descriptorCone(){
                return this
            }

            descriptorAffect(){
                return this
            }

            descriptorAffectAura(){
                return this
            }
    }

    class AirEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        cast({caster, affected , duration = 1}={}){
                super.castCommon({caster:caster, affected:affected})
                .file("animated-spell-effects-cartoon.air.portal")
                .playbackRate(1)
                .scaleToObject(3)
                .waitUntilFinished(-800)

                super.castCommon()
                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-air-moving-2.mp3")
                return this;
        }
        cast2({caster, affected , duration = 1}={}){
                super.castCommon({caster:caster, affected:affected})
                .file("animated-spell-effects-cartoon.air.portal")
                .scaleToObject(3)
                .playbackRate(1)
                .waitUntilFinished(-500)

                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-air-moving-2.mp3")
            
                super.castCommon()
                .file("animated-spell-effects-cartoon.air.spiral.gray")
                .scaleToObject(2.5)
                .playbackRate(1)
                .waitUntilFinished(-200)

            return this;
        }
        castRange({caster, affected , duration = 1}={}){
            //this is for healing//
                super.castCommon({caster:caster, affected:affected})
                .file("animated-spell-effects-cartoon.air.portal")
                .attachTo(this.caster, {offset:{x:0, y: -0.0}, gridUnits:true, followRotation: false})
                .scaleToObject(2.5)
                .fadeIn(250)
                .scaleIn(0, 500, {ease: "easeOutCubic"})
                .fadeOut(500)
                .belowTokens()
                .opacity(0.85)
                .filter("ColorMatrix", { saturate:-1 })
                
                super.castCommon()
                .file("animated-spell-effects-cartoon.air.explosion.gray")
                .attachTo(this.caster, {offset:{x:0, y: -0.0}, gridUnits:true, followRotation: false})
                .scaleToObject(1.45)
                .fadeIn(250)
                .scaleIn(0, 500, {ease: "easeOutCubic"})
                .fadeOut(500)
                .belowTokens()

                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-air-moving-2.mp3") 
                
                super.castCommon()
                .file("jb2a.wind_stream.white")
                .attachTo(this.caster, {offset:{x:0, y: 0}, gridUnits:true, followRotation: false})
                .scaleToObject(2)
                .fadeIn(1000)
                .fadeOut(500)
                .opacity(0.5)
                .filter("ColorMatrix", { saturate:1, brightness:2 })
                .rotate(90)
                .mask()

            super.castCommon()
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.caster, {offset:{x:0.2*this.caster.document.width, y: 0.45*this.caster.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.5, {considerTokenScale: true})
                .rotate(-30)
                
                .filter("ColorMatrix", {saturate: -1, brightness: 0  })
                .filter("Blur", {blurX: 5, blurY:10 })
                .opacity(0.5)
                
            super.castCommon()
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.caster, {offset:{x:0.2*this.caster.document.width, y: 0.35*this.caster.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.5, {considerTokenScale: true})
                .rotate(-30)
                .zIndex(0.1)
                
            super.castCommon()
                .delay(700)
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.caster, {offset:{x:-0.4*this.caster.document.width, y: -0.25*this.caster.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.2, {considerTokenScale: true})
                .belowTokens(false)
                .mirrorY(true)
                .rotate(110)
                
                .filter("ColorMatrix", {saturate: -1, brightness: 0  })
                .filter("Blur", {blurX: 5, blurY:10 })
                .opacity(0.5)
                
            super.castCommon()
                .delay(700)
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.caster, {offset:{x:-0.4*this.caster.document.width, y: -0.35*this.caster.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.2, {considerTokenScale: true})
                .belowTokens(false)
                .mirrorY(true)
                .rotate(110)
                .zIndex(0.1)

            return this;
        }

        descriptorFlight( position) {
         
            this.file("animated-spell-effects-cartoon.energy.16")
			.scaleToObject(1)
			.aboveLighting()
			.filter("ColorMatrix", {
				hue: 500, // Keep hue neutral for grey
				contrast: 0, 
				saturate: 0, // Set saturation to 0 to remove color
				brightness: 1
			})
			.rotate(270) 
            .affectCommon()
                .file("animated-spell-effects-cartoon.energy.16")
                .spriteOffset({x:0, y: -25})
                .atLocation(this.caster)
                .scaleToObject(1)
                .aboveLighting()
                .mirrorY()
                .filter("ColorMatrix", {
                    hue: 500, // Keep hue neutral for grey
                    contrast: 0, 
                    saturate: 0, // Set saturation to 0 to remove color
                    brightness: 1
                })
                .rotate(270)  // Rotate the animation 90 degrees
            .affectCommon()
                .file("animated-spell-effects-cartoon.energy.16")
                .spriteOffset({x:0, y: 25})
                .atLocation(this.caster)
                .scaleToObject(1)
                .aboveLighting()
                .mirrorY()
                .filter("ColorMatrix", {
                    hue: 500, // Keep hue neutral for grey
                    contrast: 0, 
                    saturate: 0, // Set saturation to 0 to remove color
                    brightness: 1
                })
                .rotate(270)  // Rotate the animation 90 degrees
                .pause(800)
			.affectCommon()
				.file("animated-spell-effects-cartoon.smoke.53")
				.atLocation(this.caster)
				.scaleToObject(3)
				.anchor({ x: 0.5, y: 0.7 })
				.aboveLighting()
				this.pause(800)
                .waitUntilFinished(-1000)     
                    .thenDo(() => {      
                        Sequencer.EffectManager.endEffects({ name: "flyAir" })    
                    })
            return this
        }
        descriptorCastFlight(position) {
            this.file("animated-spell-effects-cartoon.air.portal")
                .fadeIn(350)
                .fadeOut(350)
                .scaleToObject(1.5)
                .filter("ColorMatrix", { hue: -10, contrast: 0.5, saturate: 0.1, brightness: 1 })
                .randomRotation()
                .belowTokens()
                .duration(1800)
                .waitUntilFinished(-500)
            .castCommon()
                .file(`animated-spell-effects-cartoon.air.portal`)
                .opacity(0.9)
                .scaleToObject(1.5)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
                .waitUntilFinished(-500)
             this.castCommon()
                .name("flyAir")
                .file("animated-spell-effects-cartoon.smoke.65")
                .scaleToObject(2)
                .spriteRotation(90)
                .rotate(90)
                .opacity(1)
                .loopProperty("sprite", "position.x", {  from:0 ,to:0.200, duration: 2500, pingPong: true, delay:500, ease: "easeInOutCubic", gridUnits:true})
                .filter("ColorMatrix", {hue:0, contrast: 0, saturate: 0.5,brightness: 1,})
                .spriteOffset({x: 40, y: 0.5})
                .attachTo(this.caster, {bindAlpha: false})
                .persist()
            .castCommon()
                .file("animated-spell-effects-cartoon.smoke.17")
                .scaleToObject(3)
                .anchor({ x: 0.5, y: 0.8 })
                .belowTokens()
                .pause(500)
               
            .castCommon()
                .file("jb2a.extras.tmfx.border.circle.outpulse.01.normal")
                .scaleToObject(2)
                .opacity(0.15)
          /*  this.castCommon()
                .from(this.caster)
                .name("flyAir")
                .opacity(1)
                .scale(1.05)
                .duration(800)
                .anchor({ x: 0.50, y: 0.9 })
                .loopProperty("sprite", "position.y", {  from:0 ,to:-0.25, duration: 2500, pingPong: true, delay:500, ease: "easeInOutCubic", gridUnits:true})
                .attachTo(this.caster, {bindAlpha: false, followRotation: false})
                .zIndex(10)
                .persist()*/
                return this
        }
        descriptorCastLeaping(position) {
            this.initalizeMiddleAndEndDistance(position)
            this.castCommon()
                .file("animated-spell-effects-cartoon.smoke.69")
                .scaleToObject(1.75)
                .belowTokens()
                .randomRotation()
                .scaleIn(0, 300, {ease: "easeOutExpo"})
                .opacity(0.85)
                .zIndex(1)
            .castCommon()
                .file("jb2a.swirling_leaves.ranged.blue")
                .delay(50)
                .stretchTo(this.middlePoint)
                .opacity(1)
                .spriteOffset({x:0}, {gridUnits :true})
                .randomizeMirrorY()
                .endTime(1300)
                .fadeOut(500)
                .zIndex(3)
                .playbackRate(2.25)
               .playIf(() => {
               return this.middleDistance > canvas.grid.size*2;
                })

            .castCommon()
                .file("jb2a.energy_strands.range.standard.grey")
                .stretchTo(this.middlePoint)
                .opacity(0.45)
                .repeats(3,50,50)
                .spriteOffset({x:0}, {gridUnits :true})
                .filter("ColorMatrix", { brightness: 1.2 })
                .randomizeMirrorY()
                .fadeOut(200)
                .zIndex(4)
            return this
        }
        descriptorCastTeleport(position) {
        }
  
        descriptorCastBurrowing(position) {
               this.castCommon()
                .file("animated-spell-effects-cartoon.air.portal")

                .scaleToObject(2.5)
                .playbackRate(1)
                .waitUntilFinished(-200)


               .castCommon()
                .file("jb2a.burrow.out.01.brown.1")

                .scaleToObject(4.5)
                .playbackRate(1.25)
                .belowTokens()

               .castCommon()
                .file("jb2a.extras.tmfx.outpulse.circle.02.normal")

                .size(4, {gridUnits: true})
                .belowTokens()

               .castCommon()
                .file("animated-spell-effects-cartoon.air.explosion.gray")

                .scaleToObject(2.5)
                .playbackRate(1.25)
                .waitUntilFinished(-200)

               .castCommon()
                .file("jb2a.energy_strands.range.standard.grey")
                .atLocation(this.caster)
                .stretchTo(position)
                .belowTokens()
                .opacity(0.65)
                .repeats(3,50,50)
                .spriteOffset({x:0}, {gridUnits :true})
                .filter("ColorMatrix", { brightness: 1.2 })
                .randomizeMirrorY()
                .fadeOut(200)
                .zIndex(0.2)

               .castCommon()
                .file("jb2a.extras.tmfx.outpulse.circle.02.fast")

                .size(4, {gridUnits: true})

                .wait(1000)
            return this
        }
        descriptorLeaping(position){
            let jumpTime = 750;
            let upTime = jumpTime*0.5;
            let downTime = jumpTime*0.4;
            this.affectCommon()
          .delay(jumpTime-downTime)
                .file("jb2a.energy_strands.range.standard.grey")
                .atLocation(this.middlePoint)
                .stretchTo(position)
                .opacity(0.45)
                .repeats(3,50,50)
                .spriteOffset({x:0}, {gridUnits :true})
                .filter("ColorMatrix", { brightness: 1.2 })
                .randomizeMirrorY()
                .fadeOut(200)
                .zIndex(4)
            this.affectCommon()
                .delay(jumpTime-downTime)
                .file("jb2a.swirling_leaves.ranged.blue")
                .atLocation(this.middlePoint)
                .stretchTo(position)
                .opacity(1)
                .spriteOffset({x:0}, {gridUnits :true})
                .randomizeMirrorY()
                .endTime(1300)
                .fadeOut(500)
                .zIndex(3)
                .playbackRate(2.25)
                .playIf(() => {
                return this.endDistance > canvas.grid.size*2;
                })
            .affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.69")
                .scaleToObject(1.75)
                .belowTokens()
                .randomRotation()
                .scaleIn(0, 300, {ease: "easeOutExpo"})
                .opacity(0.85)
            return this
        }
        descriptorTeleport(position){
            
        }
        descriptorCastSpeed(position){
            this.file("jb2a.particles.inward.white.01.02")
                .fadeIn(350)
                .fadeOut(350)
                .scaleToObject(3)
                .randomRotation()
                .belowTokens()
                .duration(1800)
            super.castCommon()
                .file("jb2a.particles.inward.white.01.02")
                .fadeIn(350)
                .fadeOut(350)
                .scaleToObject(3)
                .randomRotation()
                .belowTokens()
                .duration(1800) 
            super.castCommon()
                .file("animated-spell-effects-cartoon.air.portal")
                .fadeIn(250)
                .fadeOut(200)
                .scaleToObject(2)  
                .pause(2500)
            super.castCommon()
                .file("animated-spell-effects-cartoon.air.puff.03")
                .belowTokens()
                //tint this grey
             //   .tint("#0e7c1b")
                .fadeOut(1000)
                .scaleToObject(4)
                .zIndex(2)

            super.castCommon()
                .file("animated-spell-effects-cartoon.air.explosion")
                .scaleToObject(3.5)
                .tint('#808080')
            super.castCommon()
                .file("jb2a.smoke.puff.side.02.white")
                .rotateTowards(position)
                .rotate(180)
                .pause(200)
            super.castCommon()
                .file("animated-spell-effects-cartoon.air.bolt.square")
                .opacity(0.9)
                .playbackRate(0.5)
                .spriteOffset({x: -3.5}, {gridUnits: true})
                .stretchTo(position, {cacheLocation: true})
                .pause(200)
                .canvasPan()
                .shake({duration: 1500, strength: 1, rotation: false })       
            super.castCommon()
                .file("animated-spell-effects-cartoon.smoke.99")
                .spriteOffset({ x: -2.5, y: -1 }, { gridUnits: true })
                .rotateTowards(this.caster)
                .rotate(90)
                .scaleToObject(5, {considerTokenScale: true})
                .tint('#808080')

            return this
        }
        descriptorBurrowing(position){
            this.castCommon()
            .file("jb2a.burrow.out.01.brown.1")
            .atLocation(position)
            .scaleToObject(4.5)
            .playbackRate(1.25)
            .belowTokens()

           .castCommon()
            .file("jb2a.extras.tmfx.outpulse.circle.02.normal")
            .atLocation(position)
            .size(4, {gridUnits: true})
            .belowTokens()

           .castCommon()
            .file("animated-spell-effects-cartoon.air.explosion.gray")
            .atLocation(position)
            .scaleToObject(2.5)
            .playbackRate(1.25)
            .waitUntilFinished(-200)
            return this
        }


        descriptorCast(){   
            this.file("animated-spell-effects-cartoon.air.portal")
            .playbackRate(1)
            .scaleToObject(3)
            .waitUntilFinished(-800)

            super.castCommon()
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-air-moving-2.mp3")

            return this
        }
        meleeCast({caster, affected, repeats=1}={} ){
            super.meleeCastCommon({caster:caster, affected:affected}) 
            let target = Array.from(game.user.targets)[0];
            let targetCenter = {
                x: this.affected.x+canvas.grid.size*this.affected.document.width/2,
                y: this.affected.y+canvas.grid.size*this.affected.document.width/2,
                };
                
                const tokenCenter = {
                x: this.caster.x+canvas.grid.size*this.caster.document.width/2,
                y: this.caster.y+canvas.grid.size*this.caster.document.width/2,
                };
                
                const middleposition = {
                    x: (targetCenter.x - tokenCenter.x)* 0.25,
                    y: (targetCenter.y - tokenCenter.y)* 0.25,
                };


            this.effect()
                .file("animated-spell-effects-cartoon.air.portal")
                .atLocation(this.caster) 
                .playbackRate(1)
                .scale(0.5)
                .delay(500)
                .belowTokens(false)
                .waitUntilFinished(-1000)

                .wait(1000)

            super.meleeCastCommon()
                .file("jb2a.unarmed_strike.no_hit.01.blue")
                .atLocation(this.caster, { edge: "outer" })
                .stretchTo(this.affected)
                .filter("ColorMatrix", { hue: 0, brightness: 1, contrast: 0, saturate: -0.8 })
                .tint("#e6e6e6")
                .delay(100)
                .playbackRate(1.25)
                .fadeOut(100)
                .zIndex(2)

                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-air-moving-2.mp3")
                .fadeInAudio(500)
                .fadeOutAudio(500)
                
                .wait(750)

                .canvasPan()
                .delay(250)
                .shake({duration: 250, strength: 2, rotation: false })

            super.meleeCastCommon()
                .file("jb2a.swirling_leaves.outburst.01.pink")
                .scaleIn(0, 500, {ease: "easeOutCubic"}) 
                .filter("ColorMatrix", { saturate: 1, hue: -105 })
                .scaleToObject(0.75)
                .fadeOut(2000)
                .atLocation(this.caster)
                .zIndex(1)

                .animation()
                .on(this.caster)
                .opacity(0)

            super.meleeCastCommon()
                .from(this.caster)
                .atLocation(this.caster)
                .mirrorX(this.caster.document.mirrorX)
                .animateProperty("sprite", "position.x", { from: 0, to: middleposition.x, duration: 100, ease:"easeOutExpo"})
                .animateProperty("sprite", "position.y", { from: 0, to: middleposition.y, duration: 100, ease:"easeOutExpo"})
                .animateProperty("sprite", "position.x", { from: 0, to: -middleposition.x, duration: 350, ease:"easeInOutQuad", fromEnd:true})
                .animateProperty("sprite", "position.y", { from: 0, to: -middleposition.y, duration: 350, ease:"easeInOutQuad", fromEnd:true})
                .scaleToObject(1, {considerTokenScale: true})
                .duration(600)

                .animation()
                .on(this.caster)
                .opacity(1)
                .delay(600)

            super.meleeCastCommon()
                .file("animated-spell-effects-cartoon.water.85")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.8)
                .atLocation(this.affected)
                .filter("ColorMatrix", {hue: 5, brightness: 1, contrast: 0, saturate: -0.8})
                .randomRotation()

            super.meleeCastCommon()
                .file("animated-spell-effects-cartoon.air.spiral.gray")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.8)
                .atLocation(this.affected)
                .filter("ColorMatrix", {hue: 5, brightness: 1, contrast: 0, saturate: -0.8})
                .randomRotation()

            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Hunter%27s-Mark_Sneak-Attack.mp3")
                .fadeInAudio(500)
                .fadeOutAudio(500)

                .sound()
                .file("modules/lancer-weapon-fx/soundfx/Axe_swing.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)

            super.meleeCastCommon()
                    .file("jb2a.impact.ground_crack.white")
                    .scaleToObject(3)
                    .atLocation(target)
                    .randomRotation()
                    .belowTokens()

            super.meleeCastCommon()
                    .file("jb2a.smoke.puff.ring.01.white.0")
                    .atLocation(target)
                    .scale(1.5)
                    .zIndex(4)
                    
                super.meleeCastCommon()
                    .delay(200)
                    .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                    .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                    .scaleToObject(1.75)
                    .opacity(0.5)
                    .atLocation(target)
                    .belowTokens()
                    
                super.meleeCastCommon()
                    .delay(200)
                    .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                    .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                    .scaleToObject(2.5)
                    .opacity(0.5)
                    .atLocation(target)
                    .belowTokens()
                    
                super.meleeCastCommon()
                    .from(target)
                    .atLocation(target)
                    .fadeIn(200)
                    .fadeOut(500)
                    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                    .scaleToObject(target.document.texture.scaleX)
                    .duration(3000)
                    .opacity(0.25)
            return this
        }
        descriptorMeleeCast(){
            return this
        }
        
        projectRange({caster, target }={}){ 
            super.projectCommon({caster:caster,target:target})
            .file("animated-spell-effects-cartoon.air.bolt.square")
            .stretchTo(this.affected)
            .playbackRate(1)
            .scale(1.5)
            
        super.projectCommon()
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Spells/Whoosh/spell-whoosh-22.mp3")
            .delay(1000)            
            return this;
        }            

        descriptorProject() {
        super.projectCommon({caster: this.caster,target: this.affected})
            .file("animated-spell-effects-cartoon.air.bolt.ray")
            .stretchTo(this.affected)
            .playbackRate(1)
            .scale(1.5)

        super.projectCommon()
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Spells/Whoosh/spell-whoosh-22.mp3")
            .delay(1000)
            return this;
        }
        descriptorProjectToLine() {
            return this.file("animated-spell-effects-cartoon.air.bolt.square")
            .playbackRate(1)
            .scale(1.5)
            
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Spells/Whoosh/spell-whoosh-22.mp3")
            .delay(1000)
        }
        descriptorProjectToCone() {
            return this.descriptorProjectToLine()
        }    

        descriptorBurst() {
            this.file("animated-spell-effects-cartoon.air.explosion.gray")
                .scaleToObject (1)
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .zIndex(2)

            super.burstCommon()    
                .file("animated-spell-effects-cartoon.air.puff.02")
                .scaleToObject(1)
                .opacity(1)
                .playbackRate(0.8)
                .belowTokens()
                .filter("ColorMatrix", {saturate: -2, brightness: 1  })
                .tint("#FFFFFF")
            return this;
        }
        descriptorLine() {

            this.file("animated-spell-effects-cartoon.air.wall")
                .playbackRate(1)
                .delay(800)
                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Hunter%27s-Mark_Sneak-Attack.mp3")
                .delay(1800)
            super.affectCommon()
                .file("animated-spell-effects-cartoon.air.spiral.gray")
                .playbackRate(1)
                .scale(0.5)
                .delay(800)
                .waitUntilFinished(-2500)             
            super.lineCommon()
                .file("animated-spell-effects-cartoon.smoke.87")
                .scale(1, 2.5)
                .aboveLighting()
                .rotate(-90)
                .anchor({ x: 1, y: 0.7 })
                .fadeIn(50)
                .fadeOut(50)
            return this
        }
        descriptorCone({affected} = {}) {
         //   const template = canvas.templates.placeables[canvas.templates.placeables.length - 1];
         //   const coneStart = { x: template.x, y: template.y };
            
            this.file("animated-spell-effects-cartoon.air.blast.circle")
              //  .atLocation(this.templateStart)
                .playbackRate(1)
                .scale(0.5)
                .delay(800)

                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Hunter%27s-Mark_Sneak-Attack.mp3")
                .delay(1800)
                
                super.affectCommon()
                .file("animated-spell-effects-cartoon.air.spiral.gray")
           //     .atLocation(this.templateStart)
                .playbackRate(1)
                .scale(0.5)
                .delay(800)
                .waitUntilFinished(-2500)
                        
                super.coneCommon()
                .file("animated-spell-effects-cartoon.air.gust.gray")
            //    .atLocation(this.templateStart)
            //    .stretchTo(template)
                .fadeIn(100)
                .fadeOut(100)
                .delay(1)
                .rotate(-90)
                .anchor({ x: 1, y: 0.8 })
                .playbackRate(1.5)

                .canvasPan()
                .delay(1500)
                .shake({duration: 800, strength: 1, rotation: false })
            return this;
        }
        descriptorAffliction() {
            this.file("animated-spell-effects-cartoon.air.wall")
                .attachTo(this.affected)
                .playbackRate(1.5)
                .scale(0.8)
                .fadeIn(500)
                .mask()
                .persist()
                
                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-wind-howling-1.mp3")
                .duration(5000)
                .fadeOutAudio(800)
            return this;
        }
        descriptorAura(){
            return this.file("animated-spell-effects-cartoon.air.portal")
            .playbackRate(1)
            .scaleToObject(3)
            .waitUntilFinished(-800)
            .affectCommon()
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-air-moving-2.mp3")
        }
        descriptorDamage(){
        
            this.file("animated-spell-effects-cartoon.air.blast.circle")
            .playbackRate(1)
            .scale(0.5)
            .delay(800)

            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Spells/Hunter%27s-Mark_Sneak-Attack.mp3")
            .delay(1000)
            return this;
            
        }
        descriptorHealing(){
            this.file("jb2a.healing_generic.03.burst.bluegreen")
                .delay(700)
                .scaleToObject(3)
                .filter("ColorMatrix", {saturate: -2, brightness: 1  })
                .tint("#FFFFFF")
                .opacity(1)

                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-lively-3.mp3")
                .fadeOutAudio(800)            
            return this
        }
        affectHealing2({affected = this.affected|| this.firstSelected}={}){
            super.affectCommon({affected:affected, persist:false})
                .file("animated-spell-effects-cartoon.air.portal")
                .attachTo(this.affected, {offset:{x:0, y: -0.0}, gridUnits:true, followRotation: false})
                .scaleToObject(2.5)
                .fadeIn(250)
                .scaleIn(0, 500, {ease: "easeOutCubic"})
                .fadeOut(500)
                .belowTokens()
                .opacity(0.85)
                .filter("ColorMatrix", { saturate:-1 })
                
                super.affectCommon()
                .file("animated-spell-effects-cartoon.air.explosion.gray")
                .attachTo(this.affected, {offset:{x:0, y: -0.0}, gridUnits:true, followRotation: false})
                .scaleToObject(1.45)
                .fadeIn(250)
                .scaleIn(0, 500, {ease: "easeOutCubic"})
                .fadeOut(500)
                .belowTokens()
                
                super.affectCommon()
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.affected, {offset:{x:0.2*token.document.width, y: 0.45*token.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.5, {considerTokenScale: true})
                .rotate(-30)
                
                .filter("ColorMatrix", {saturate: -1, brightness: 0  })
                .filter("Blur", {blurX: 5, blurY:10 })
                .opacity(0.5)
                
                super.affectCommon()
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.affected, {offset:{x:0.2*token.document.width, y: 0.35*token.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.5, {considerTokenScale: true})
                .rotate(-30)
                .zIndex(0.1)
                
                super.affectCommon()
                .delay(700)
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.affected, {offset:{x:-0.4*token.document.width, y: -0.25*token.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.2, {considerTokenScale: true})
                .belowTokens(false)
                .mirroredY(true)
                .rotate(110)
                
                .filter("ColorMatrix", {saturate: -1, brightness: 0  })
                .filter("Blur", {blurX: 5, blurY:10 })
                .opacity(0.5)
                
                super.affectCommon()
                .delay(700)
                .file("animated-spell-effects-cartoon.smoke.19")
                .attachTo(this.affected, {offset:{x:-0.4*token.document.width, y: -0.35*token.document.width}, gridUnits:true, followRotation: false})
                .scaleToObject(1.2, {considerTokenScale: true})
                .belowTokens(false)
                .mirroredY(true)
                .rotate(110)
                
                .zIndex(0.1)
                
                super.affectCommon()
                .delay(700)
                .file("jb2a.healing_generic.03.burst.bluegreen")
                .atLocation(this.affected)
                .scaleToObject(3)
                .filter("ColorMatrix", {saturate: -2, brightness: 1  })
                .tint("#FFFFFF")
                .opacity(1)
                .waitUntilFinished()
            return this;

        }
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorDeflection(){
            this.deflectionAnimation="jb2a.bullet.Snipe.blue"
                this.delay(500)
                .file("animated-spell-effects-cartoon.air.spiral.gray")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.5)
                .duration(2000)
                .pause(800)

            super.affectCommon()
                .file("jb2a.explosion.04.blue")
                .fadeOut(5000)
                .scaleToObject(4)
                .duration(1000)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                .belowTokens()
                .zIndex(3)

            super.affectCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .scaleToObject(3)
                .belowTokens()
                .opacity(1)
                .pause(800)
            
            super.affectCommon()
                .file("jb2a.impact.001.blue")
                
                .scaleToObject(2)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)

            super.affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)

            super.affectCommon()
                .file("jb2a.particles.outward.blue.01.03")
                
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(3)
                .duration(10000)
            
            .pause(500)
            
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                .duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1)
            
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)
            
            super.affectCommon()
                .file("animated-spell-effects-cartoon.air.portal")
            
                .playbackRate(0.8)
                .opacity(1)
                .scaleIn(0.5, 800, {ease: "easeInBack"})
                .scaleOut(0.5, 1000, {ease: "easeInBack"})
                .scaleToObject(2)
                .duration(4000)
                .delay(400)
                .filter("ColorMatrix", {hue:0, contrast: 0.5, saturate: 0.1,brightness: 0.8,})
                .belowTokens()
            
            super.affectCommon()
                .file("animated-spell-effects-cartoon.air.spiral.gray")
                
                .playbackRate(0.8)
                .opacity(0.8)
                .scaleIn(0.5, 800, {ease: "easeInBack"})
                .scaleOut(0.5, 1000, {ease: "easeInBack"})
                .scaleToObject(1.8)
                .duration(4000)
                .delay(400)
                .filter("ColorMatrix", {hue:0, contrast: 0.5, saturate: 0.1,brightness: 0.8,})
                
                .playSound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Whoosh/spell-whoosh-9.mp3")
                .delay(10)
                
                .playSound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Whoosh/spell-whoosh-20.mp3")
                .delay(1000)
        }

    

        descriptorProtection(){
            this.affectCommon() 
            return this.file("animated-spell-effects-cartoon.air.puff.02")
            .pause(500)
            .scaleToObject(1.5)
            .affectCommon()
                .file("animated-spell-effects-cartoon.air.spiral.gray")
                .scaleToObject(1.5)
                .pause(1000)
            .affectCommon()
                .file("animated-spell-effects-cartoon.air.portal")
                .scaleToObject(1.5)
                .persist()
        }

        descriptorSpeed(position){
            super.affectCommon()
            .file("animated-spell-effects-cartoon.air.spiral.gray")
            .fadeOut(3000)
            .scaleToObject(6)
            .zIndex(3)
            return this
        }

        descriptorTransform(){
            return  this.file("animated-spell-effects-cartoon.air.explosion.gray")
            .pause(800)
            .scaleToObject(1.5)
        .affectCommon()
            .file("animated-spell-effects-cartoon.air.portal")
            .scaleToObject(1.5)
            .pause(1200)
        .affectCommon()
            .file("animated-spell-effects-cartoon.air.spiral.gray")
            .persist()
            .scaleToObject(1.5)
        .hideToken(this.affected)
        }

    }


    class ColorEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class CosmicEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }

    class CurseEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class DarknessEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class EarthEffectSection extends TemplatedDescriptorEffect {

        /* castCone({affected, caster}={}){
                return this
            }*/
        castCrack({affected:affected, caster:caster}={}){
            super.castCommon({affected:affected, caster:caster})
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .belowTokens()
                .scaleToObject(2)
                .opacity(0.5)
                .duration(2000)
                .delay(500)
                .pause(800)

            super.castCommon({rotation:true})
                .file("jb2a.explosion.04.orange")
                .fadeOut(5000)
                .anchor({x:0.2})
                .scaleToObject(2)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                .duration(1000)
                .zIndex(3)
            
            super.castCommon({rotation:true})
                .file("jb2a.impact.ground_crack.white.03")
                .belowTokens()
                .anchor({x: 0.1})
                .scaleToObject(2)
                
                .opacity(1)
                return this
            }
        castSpark({affected, caster}={}){
            this.castCrack({affected:affected, caster:caster})
            super.castCommon({rotation:true})
                .file("modules/animated-spell-effects/spell-effects/earth/earth-cracks_SQUARE_01.webm")
                .belowTokens()
                .anchor({x: -0.2})
                .size(2, { gridUnits: true })
                .fadeOut(2000)
                .opacity(1)
                .zIndex(1)
                .delay(300)
                .duration(8000)
            
                .canvasPan()
                .delay(200)
                .shake({ duration: 800, strength: 5, rotation: false })
            
                .canvasPan()
                .delay(1000)
                .shake({ duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
                .delay(500)
            super.castCommon({rotation:true})
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.1)
                return this
            }
        castMud({affected, caster}={}){
                super.castCommon({affected:affected, caster:caster})
                    .delay(500)
                    .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                    .scaleToObject(2)
                    .belowTokens()
                    .opacity(0.5)
                    .duration(2000)
                
                    .wait(800)

                super.castCommon()
                    .file("jb2a.explosion.04.orange")
                    .fadeOut(5000)
                    .scaleToObject(2)
                    .duration(1000)
                    .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                    .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                    .belowTokens()
                    .zIndex(3)

                super.castCommon()
                    .file("jb2a.impact.ground_crack.white.03")
                    .scaleToObject(3)
                    .belowTokens()
                    .opacity(1)
                    .canvasPan()
                    .delay(1000)
                    .shake({ duration: 3000, strength: 2, rotation: false, fadeOutDuration: 1000 })
                    .wait(800)

                super.castCommon()
                .file("jb2a.liquid.splash.brown")
                .scaleToObject(3)
                .zIndex(5)
                return super.castCommon({affected:affected, caster:caster})
                .file("jb2a.liquid.splash.brown")
                .scaleToObject(3)
                .zIndex(5)
            return this
            }
        descriptorCast(){ 
                this.rotateTowards(this.affected)
                    
                .file("jb2a.impact.ground_crack.white.03")
                .anchor({x: 0.1})
                .scaleToObject(2)
                .belowTokens()
                .opacity(1)
                
                .canvasPan()
                .delay(200)
                .shake({duration: 800, strength: 5, rotation: false })
                
                .canvasPan()    
                .delay(1000)
                .shake({duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
                return this
            }

        descriptorMeleeCast(){
            return this
        }
            
        descriptorCastBurrowing(position){

            this.delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.5)
                .duration(2000)
                .pause(800)
            super.affectCommon()
                .file("jb2a.explosion.04.orange")
                .fadeOut(5000)
                .anchor({x:0.2})
                .scaleToObject(2)
                .duration(1000)
                .rotateTowards(position, { cacheLocation: true })
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                .zIndex(3)
                .pause(1000)
            super.affectCommon()
                .file("jb2a.impact.ground_crack.white.03")
                //   .anchor({x: 0.1})
                .rotateTowards(position, {cacheLocation: true})
                .scaleToObject(2)
                .belowTokens()
                .opacity(1)
            super.affectCommon()
                .file("-Assets/Images/Effects/CrackedEarthWEBP.webp")
                .belowTokens()
                .anchor({x: -0.2})
                .size(2, { gridUnits: true })
                .rotateTowards(position, { cacheLocation: true })
                .delay(300)
                .duration(8000)
                .fadeOut(2000)
                .opacity(1)
                .zIndex(1)
                .canvasPan()
                .delay(200)
                .shake({ duration: 800, strength: 5, rotation: false })
                .canvasPan()
                .delay(1000)
                .shake({ duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
            super.affectCommon()
                .file("blfx.spell.template.line.crack1")
                .delay(200)
                .zIndex(5)
                .stretchTo(position)
                .pause(500)
            
            super.affectCommon()
                .file("jb2a.impact.earth.01.browngreen")
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            super.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)  
                .pause(100)
            super.affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(4)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            super.affectCommon()
                .file("jb2a.particles.outward.orange.01.03")
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(4)
                .duration(10000)
            return this;
        }
        descriptorCastFlight(position){
            this.file("animated-spell-effects-cartoon.earth.crack")
           // .randomSpriteRotation()
            .playbackRate(1)
            .scale(0.5)
            .belowTokens()
            super.castCommon()
                .file("animated-spell-effects-cartoon.earth.explosion.02")
                .anchor({ x: 0.5, y: 0.66 })
                .playbackRate(1)
                .scale(0.5)
            super.castCommon()
                .file("jb2a.impact.earth.01.browngreen")
                .filter("ColorMatrix", {hue: 0, contrast: 0.5, saturate: 0})
                .opacity(0.8)
             
                .belowTokens()
                .playbackRate(1.5)
                .randomSpriteRotation()
                .scaleToObject(3)
                .waitUntilFinished(0)      
            super.castCommon()
                .file("jb2a.impact.boulder.01")
                .size({ width: this.affected.document.width * 2.5, height: this.affected.document.width * 2.45 }, { gridUnits: true })
                .belowTokens()
                .filter("ColorMatrix", { hue: -10 })
                .zIndex(1)
                .pause(10)
            .castCommon()
                .file("jb2a.impact.boulder.01")
                .opacity(1)
                .scaleToObject(2)
                .tint("c1f8f6")
                .belowTokens() 
                super.castCommon()
                this.file("jb2a.gust_of_wind.default")
                    .opacity(1)
                    .tint("#1c1c1c")
                    .scale(this.affected.w / canvas.grid.size)
                    .stretchTo(position)
                    .belowTokens()
                    .zIndex(1)
            
            return this
        }
        descriptorCastLeaping(position){
            this.file("jb2a.impact.earth.01.browngreen")
            .scaleToObject(5)
            .fadeOut(1000, {ease: "easeInExpo"})
            .zIndex(6)
            
            super.castCommon()
            .file("jb2a.burrow.out.01.brown.1")
            .scaleToObject(5)
            .fadeOut(1000, {ease: "easeInExpo"})
            .zIndex(5)
            
            .pause(100)
            
            super.castCommon()
            .delay(100)
            .file("animated-spell-effects-cartoon.smoke.11")
            .playbackRate(0.65)
            .fadeIn(250)
            .fadeOut(1500)
            .scaleToObject(4)
            .randomRotation()
            .opacity(0.5)
            .filter("ColorMatrix", { brightness: 0.8 })
            .zIndex(4)
            
            super.castCommon()
            .file("jb2a.particles.outward.orange.01.03")
            .fadeIn(250, {ease: "easeOutQuint"})
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .fadeOut(5000, {ease: "easeOutQuint"})
            .opacity(1)
            .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
            .randomRotation()
            .scaleToObject(5)
            .duration(10000)
            
        //  .pause(500)
            
            super.castCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(5)
            .duration(1200)
            .fadeIn(200, {ease: "easeOutCirc", delay: 200})
            .fadeOut(300, {ease: "linear"})
            .filter("ColorMatrix", { saturate: -1, brightness: 2 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .zIndex(0.1)
            
            super.castCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(5)
            .fadeOut(5000, {ease: "easeOutQuint"})
            .duration(10000)
            
            
            .pause(50)
            .canvasPan()
            .shake({duration: 1500, strength: 1, rotation: false })
            
            super.castCommon()
            .from(this.caster)
            .opacity(1)
            .duration(1000)
            .anchor({ x: 0.5, y: 1.5 })
            .loopProperty("sprite", "position.y", { values: [50, 0, 50], duration: 500})
            .moveTowards(position, {rotate:false})
            .zIndex(2)
        //   .pause(3000)
            
            super.castCommon()
            .from(this.caster)
            .opacity(0.5)
            .scale(0.9)
            .belowTokens()
            .duration(1000)
            .anchor({ x: 0.5, y: 0.5 })
            .filter("ColorMatrix", { brightness: -1 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .moveTowards(position, {rotate:false})
            .zIndex(2)
        //    .pause(5000)

            return this;
        }
        
        descriptorCastSpeed(position){
            return this.descriptorCastFlight(position)
        }
        descriptorCastTeleport(position){
            return this.descriptorCastBurrowing(position)
        }

        descriptorProjectToLine() {
            return this.file("blfx.spell.template.line.crack1")
                .fadeIn(100)
                .fadeOut(100)
                //  .pause(600)
        }
        descriptorProjectToCone() {
            
            return this.descriptorProjectToLine()
        } 

        
        earthBuff(){
            this.delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.5)
                .duration(2000)
                .pause(800)
            super.affectCommon()
                .file("jb2a.explosion.04.orange")
                .fadeOut(5000)
                .scaleToObject(4)
                .duration(1000)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                .belowTokens()
                .zIndex(3)
            super.affectCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .scaleToObject(3)
                .belowTokens()
                .opacity(1)
                .pause(800)
            super.affectCommon()
                .file("jb2a.impact.earth.01.browngreen")
                .scaleToObject(2)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            
            super.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .scaleToObject(2.5)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
                .pause(100)
            super.affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)    
            super.affectCommon()
                .file("jb2a.particles.outward.orange.01.03")
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(3)
                .duration(10000)
                .pause(500)
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                .duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1) 
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)
                return this
        }
        projectEarthBolt({caster, affected}={})
        {
            super.projectCommon({caster, affected})
            return this.file("jb2a.spell_projectile.earth.01.browngreen")
                .opacity(1)
                .delay(800)
                .waitUntilFinished(-5000)
            .pause(800)
            }
        descriptorProject() {
                this.file("jb2a.boulder.siege.01")
                .atLocation({ x: this.caster.x, y: this.caster.y }) 
                .stretchTo({
                    x: this.affected.center.x,
                    y: this.affected.center.y 
                })
                .opacity(1)
                .delay(400)
                .waitUntilFinished(-2000)
                return this;
            }
        projectCrackedEarth({caster, affected}={}){
            return super.projectCommon({caster:caster, affected: affected}) 
                .file("blfx.spell.template.line.crack1")
                    .delay(200)
                    .zIndex(5)
                    .pause(800)
            return this
        }  
        
        descriptorBurst() {
            return this.delay(1800)
                    .file(`jaamod.spells_effects.earth_tremor`)
                //     .atLocation(this.affected)
                    .scaleToObject(1)
                    .scaleIn(0, 800, {ease: "easeOutCubic"})
                    .fadeOut(1000, {ease: "linear"})
                    .belowTokens()
                    .duration(9000)
                    .zIndex(0.01)
                    .opacity(0.6)
                    .mask()
        }
        descriptorLine() {
            super.lineCommon()
            this.file("blfx.spell.template.line.crack1")
                    .delay(200)
                    .zIndex(5)
                    .pause(800)

            super.affectCommon()
                .file("jb2a.liquid.splash.brown")
                .scaleToObject(3)
                .pause(800)
            super.affectCommon()
                .file("jb2a.liquid.splash.brown")
                .atLocation(this.templateCenter)
                .scaleToObject(3)
                .pause(800)
            super.affectCommon()
                .file("jb2a.liquid.splash.brown")
                .atLocation(this.affected.ray.B)
                .scaleToObject(3)
                return this
            }

        
        cone({caster, affected}={}) {
            super.coneCommon()
                .delay(800)
                .file(`jaamod.spells_effects.earth_tremor`)
                .scaleToObject(2.3)
                .scaleIn(0, 100, {ease: "easeOutCubic"})
                .fadeOut(1000, {ease: "linear"})
                .belowTokens()
                .duration(9000)
                .zIndex(0.01)
                .opacity(0.8)
                .mask()
                
        
            this.mm3eEffect()
            .atLocation( this.templateStart)
                .file("jb2a.impact.white.0")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            //  this.coneDamage()
            
                return this;
            }
        coneDamage({caster, affected}={}){
            this.burstCommon({caster:caster, affected:affected})
                .file("jb2a.impact.white.0")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            this.burstCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            this.burstCommon()
                .file("jb2a.impact.boulder.01")
                .atLocation(this.templateStart)
                .belowTokens()
                .scaleToObject(2.5)
                .opacity(1)
            this.coneCommon()
                .file("jb2a.impact.earth.01.browngreen")
                .scaleToObject(1)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            this.burstCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .scaleToObject(1.2)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            this.initializeTemplateVariables()
            this.affectLocation = this.templateStart
            this.mm3eEffect()
                .atLocation( this.start)
                .file("https://assets.forge-vtt.com/bazaar/modules/animated-spell-effects-cartoon/assets/spell-effects/cartoon/earth/debris_02_800x80.webm")
                .atLocation(this.templateStart)
                .spriteRotation(90)
                .rotateTowards(this.affected)
                .scale(1.8)
                .playbackRate(1)
                .pause(100)
                this.burstCommon()
                .file("animated-spell-effects-cartoon.smoke.11")
                .atLocation(this.templateStart)
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3.5)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            /* this.coneCommon()
                .file("blfx.spell.template.line.crack1")
            .atLocation(this.start) 
            .stretchTo(this.templateStart)
            .opacity(1)
            .waitUntilFinished(-5000)
            .pause(800)*/
            return this
        }
        coneHealing({caster, affected}={}){
            super.coneCommon({caster:caster, affected: affected})
                .file(`jb2a.plant_growth.03.round.4x4.complete.greenyellow`)
            //     .scaleToObject(2)
                .fadeOut(1000, {ease: "linear"})
                .belowTokens()
                .duration(9000)
                .zIndex(0.01)
                .opacity(1)
                .mask(this.affected)

            super.coneCommon()
                .file("jb2a.impact.white.0")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            super.coneCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .atLocation(this.templateStart)
            //       .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            super.coneCommon()
                .file("jb2a.impact.boulder.01")
                .atLocation(this.templateStart)
                .belowTokens()
        //         .scaleToObject(2.5)
                .opacity(1)
            super.coneCommon()
                .file("jb2a.impact.earth.01.browngreen")
            //     .scaleToObject(1)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            super.coneCommon()
                .file("jb2a.burrow.out.01.brown.1")
            //    .scaleToObject(1.2)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            super.coneCommon()
                .file("https://assets.forge-vtt.com/bazaar/modules/animated-spell-effects-cartoon/assets/spell-effects/cartoon/earth/debris_02_800x80.webm")
                .atLocation(this.templateStart)
                .spriteRotation(90)
                .rotateTowards(this.templateStart)
                .delay(10)
                //   .scale(0.8)
                .playbackRate(1)      
            super.coneCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .atLocation(this.templateStart)
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
            //    .scaleToObject(3.5)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            return this
        }
        burstAffliction({caster, affected}={}){
            super.burstCommon({caster:caster, affected:affected})
            .file("jb2a.impact.earth.01.browngreen")
                .scaleToObject(1)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            this.burstCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .scaleToObject(1.2)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
                .pause(100)
            this.burstCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(2)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            this.burstCommon()
                .file("jb2a.particles.outward.orange.01.03")
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(1.2)
                .duration(8000)
            this.burstCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(2)
                .duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1)     
            this.burstCommon()
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(2)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)

            return this;
        }

        descriptorAura(){
            this.earthBuff()
            return this
        }
        descriptorAffliction() {
            this.initalizeRandomNumbers()
                
            this.delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.1)
                .duration(2000)
                .waitUntilFinished()
            super.affectCommon()
                .delay(500)
                .file(`jb2a.falling_rocks.top.1x1.sandstone`)
                
                .scaleToObject(3.2)
                this.mirrorX(this.mirroredX)
                this.mirrorY(this.mirroredY) 
                .fadeOut(500)
                .waitUntilFinished(-4000)
            super.affectCommon()
                    .file("jb2a.impact.white.0")
                
                .scaleIn(0, 500, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            super.affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3.5)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness:0.8 })
                .zIndex(4)
            
            this.animation()
                .on(this.affected)
                .opacity(0)
            super.affectCommon()
                .name(`${this.affected.document.name} Buried`)
                .from(this.affected)
                .attachTo(this.affected,{bindAlpha: false})
                .scaleToObject(1,{considerTokenScale:true})
                .persist()
                .private()
                .belowTokens()
                
                super.affectCommon()
                .delay(3500)
                .name(`${this.affected.document.name} Buried`)
                .file(`jb2a.falling_rocks.endframe.top.1x1.sandstone.01`)
                .attachTo(this.affected,{bindAlpha: false})
                .scaleToObject(3.2)
                .mirrorX(this.mirroredX)
                .mirrorY(this.mirroredY) 
                .persist()
                .belowTokens()
                .zIndex(0.1)
                .waitUntilFinished()  
                
                .thenDo(function(){
                Sequencer.EffectManager.endEffects({ name: `${this.affected.document.name} Buried`, object: this.affected });
                })
                
                .animation()
                .on(this.affected)
                .opacity(1)
                                
            return this;
        }

        descriptorBurrowing(){
            this.pause(1000)
            .file("jb2a.impact.earth.01.browngreen")
            
            .scaleToObject(4)
            .fadeOut(1000, {ease: "easeInExpo"})
            .zIndex(5)

            super.affectCommon()
            .file("jb2a.burrow.out.01.brown.1")
            
            .scaleToObject(4)
            .fadeOut(1000, {ease: "easeInExpo"})
            .zIndex(5)

            .pause(100)

            super.affectCommon()
            .delay(100)
            .file("animated-spell-effects-cartoon.smoke.11")
            .atLocation(this.affected)
            .playbackRate(0.65)
            .fadeIn(250)
            .fadeOut(1500)
            .scaleToObject(4)
            .randomRotation()
            .opacity(0.5)
            .filter("ColorMatrix", { brightness: 0.8 })
            .zIndex(4)

            super.affectCommon()
            .file("jb2a.particles.outward.orange.01.03")
            .atLocation(this.affected)
            .fadeIn(250, {ease: "easeOutQuint"})
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .fadeOut(5000, {ease: "easeOutQuint"})
            .opacity(1)
            .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
            .randomRotation()
            .scaleToObject(5)
            .duration(10000)

            .animation()
            .delay(1000)
            .on(this.affected)
            .fadeIn(200)
    return this
            // .pause(500)

            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(5)
            .duration(1200)
            .fadeIn(200, {ease: "easeOutCirc", delay: 200})
            .fadeOut(300, {ease: "linear"})
            .filter("ColorMatrix", { saturate: -1, brightness: 2 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .zIndex(0.1)

            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(5)
            .fadeOut(5000, {ease: "easeOutQuint"})
            .duration(10000)
            return this

        }
        descriptorDamage(){
            this.file("jb2a.ground_cracks.dark_red.01")
                .belowTokens()
                .anchor({x: -0.2})
                .size(2, { gridUnits: true })
            
                .rotateTowards(this.affected, { cacheLocation: true })
                .delay(300)
                .duration(3000)
                .fadeOut(2000)
                .opacity(1)
                .zIndex(1)
                
            .canvasPan()
                .delay(200)
                .shake({ duration: 800, strength: 5, rotation: false })
                
            .canvasPan()
                .delay(200)
                .shake({ duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
                
            super.affectCommon() 
                .delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.1)
                .duration(600)
            
            super.affectCommon()
                .file("jb2a.impact.white.0")
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            
            super.affectCommon()
                .file("jb2a.impact.boulder.01")
                .belowTokens()
                .scaleToObject(2.5)
                .opacity(1)
            
            super.affectCommon()
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3.5)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            super.affectCommon()
            .from(this.affected)
            .fadeIn(200)
            .fadeOut(500)
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .scaleToObject(this.affected.document.texture.scaleX)
            .duration(6000)
            .opacity(0.25)
            return this;
        }
        descriptorDeflection(){
            this.deflectionAnimation="jb2a.bullet.Snipe.orange"
                this.delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.5)
                .duration(2000)
                .pause(800)

            super.affectCommon()
                .file("jb2a.explosion.04.orange")
                .fadeOut(5000)
                .scaleToObject(4)
                .duration(1000)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                .belowTokens()
                .zIndex(3)

            super.affectCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .scaleToObject(3)
                .belowTokens()
                .opacity(1)
                .pause(800)
            
            super.affectCommon()
                .file("jb2a.impact.earth.01.browngreen")
                
                .scaleToObject(2)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)

            super.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")

                .scaleToObject(2.5)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            .pause(100)

            super.affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)

            super.affectCommon()
                .file("jb2a.particles.outward.orange.01.03")
                
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(3)
                .duration(10000)
            
            .pause(500)
            
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                .duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1)
            
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)
            
            super.affectCommon()
                .file("jb2a.shield_themed.above.molten_earth.01.orange")
            
                .playbackRate(0.8)
                .opacity(1)
                .scaleIn(0.5, 800, {ease: "easeInBack"})
                .scaleOut(0.5, 1000, {ease: "easeInBack"})
                .scaleToObject(2)
                .duration(4000)
                .delay(400)
                .filter("ColorMatrix", {hue:0, contrast: 0.5, saturate: 0.1,brightness: 0.8,})
                .belowTokens()
            
            super.affectCommon()
                .file("jb2a.shield_themed.above.molten_earth.03.orange")
                
                .playbackRate(0.8)
                .opacity(0.8)
                .scaleIn(0.5, 800, {ease: "easeInBack"})
                .scaleOut(0.5, 1000, {ease: "easeInBack"})
                .scaleToObject(1.8)
                .duration(4000)
                .delay(400)
                .filter("ColorMatrix", {hue:0, contrast: 0.5, saturate: 0.1,brightness: 0.8,})
                
                .playSound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Whoosh/spell-whoosh-9.mp3")
                .delay(10)
                
                .playSound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Whoosh/spell-whoosh-20.mp3")
                .delay(1000)
        }
        descriptorFlight(position){
            
            super.affectCommon()
                .from(this.affected)
                .file("jb2a.markers.on_token_mask.complete.01.red")
                .name("Fly")
                .attachTo(this.affected, { bindAlpha: false, followRotation: true, locale: true })
                .rotate(180)
                .scaleToObject(1, { considerTokenScale: true })
                .opacity(1)
                .duration(800)
                .tint('#964B00')
               // .filter("ColorMatrix", { hue: 30, saturate: 0.5, brightness: 0.8 }) // Brown tint
                .anchor({ x: this.affected.document.texture.scaleX * 0.5, y: 0.5 })
                .animateProperty("sprite", "position.y", { from: 50, to: 40, duration: 500, ease: "easeOutBack" })
                .loopProperty("sprite", "position.y", { from: 0, to: -5, duration: 2500, pingPong: true, delay: 1000 })
                .zIndex(2)
            //    .persist()

                super.affectCommon()
                .name("Fly")
                .scaleToObject(1.35, { considerTokenScale: true })
                .attachTo(this.affected, { bindAlpha: false })
                .opacity(1)
                .duration(800)
                .tint('#964B00')
               // .filter("ColorMatrix", { hue: 30, saturate: 0.5, brightness: 0.8 }) // Brown t
                .anchor({ x: this.affected.document.texture.scaleX * 0.55, y: 0.8 })
                .animateProperty("sprite", "position.y", { from: 50, to: -10, duration: 500, ease: "easeOutBack" })
                .loopProperty("sprite", "position.y", { from: 0, to: -50, duration: 2500, pingPong: true, delay: 1000 })
                .fadeIn(1000)
                .zIndex(2.2)
                //   .persist()
            
        super.affectCommon()
                .from(this.affected)
                .name("Fly")
                .scaleToObject(0.9)
                .duration(1000)
                .opacity(0.5)
                .belowTokens()
                .tint('#964B00')
              //  .filter("ColorMatrix", { brightness: -1 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .attachTo(this.affected, { bindAlpha: false })
                .zIndex(1)
                //.persist()
        super.affectCommon()
            this.file("jb2a.impact.ground_crack.white.01")
            .tint('#964B00')
           // .filter("ColorMatrix", { hue: 30, saturate: 0.5, brightness: 0.8 }) // Brown t
            .scale(.5)
            .scaleToObject(6)
            .aboveLighting()
            .zIndex(1)
        //  .delay(100)
        
        return this
        }
        descriptorHealing(){
            this.initalizeRandomNumbers()
                    super.affectCommon({affected:this.affected, caster:this.caster})
            .file("jb2a.extras.tmfx.outpulse.circle.03.fast")

            .scaleToObject(2)
            .belowTokens()
            .opacity(0.1)
            .duration(800)
            .waitUntilFinished()
            
            super.affectCommon({affected:this.affected, caster:this.caster})
            //.delay(500)
            .file(`jb2a.burrow.out.01.brown.1`)

            .scaleToObject(5)
            .mirrorX(this.mirroredX)
            .mirrorY(this.mirroredY) 
            .fadeOut(500)
            //   .waitUntilFinished(-4000)
            
        //    .delay(100)
            
            super.affectCommon()
            .file('jb2a.plant_growth.03.ring.4x4.complete.greenyellow')
            .zIndex(1)
            .size(1.5, {gridUnits: true})

            super.affectCommon()
            //.delay(100)
            .file('jb2a.healing_generic.burst.greenorange')
            .size(1.5, {gridUnits: true})
            .filter("ColorMatrix", { brightness: 0.8 })
            .zIndex(3)
            .scaleToObject(3)
            //  .mirrorX(this.mirrorX)
            //  .mirrorY(this.mirrorY) 
            .fadeOut(500)
            //  .waitUntilFinished(-4000)
            
            super.affectCommon()
            .file("jb2a.impact.white.0")
            
            .scaleIn(0, 500, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(1.8)
            .opacity(0.5)

            super.affectCommon()
            .file("jb2a.particles.outward.orange.01.03")
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(3)
                .duration(10000)
            
                .wait(500)
            
                super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
            
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                //.duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1)
            
                super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(3)
                .fadeOut(5000, {ease: "easeOutQuint"})
                // .duration(10000)*/
            return this
        }
        descriptorInsubstantial(){
            this.delay(500)
            .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
            .scaleToObject(2)
            .belowTokens()
            .opacity(0.5)
            .duration(2000)

            .pause(800)

            .file("jb2a.explosion.04.orange")

            .fadeOut(5000)
            .scaleToObject(4)
            .duration(1000)
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
            .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
            .belowTokens()
            .zIndex(3)

            super.affectCommon()
            .file("jb2a.impact.ground_crack.white.03")
            .scaleToObject(3)
            .belowTokens()
            .opacity(1)
            .pause(800)

            super.affectCommon()
            .file("jb2a.impact.earth.01.browngreen")
            .scaleToObject(2)
            .fadeOut(1000, {ease: "easeInExpo"})
            .attachTo(this.caster, {bindAlpha: false})
            .zIndex(5)

            super.affectCommon()
            .file("jb2a.burrow.out.01.brown.1")
            .scaleToObject(2.5)
            .fadeOut(1000, {ease: "easeInExpo"})
            .attachTo(this.caster, {bindAlpha: false})
            .zIndex(5)

            .pause(100)

            super.affectCommon()
            .delay(100)
            .file("animated-spell-effects-cartoon.smoke.11")
            .playbackRate(0.65)
            .fadeIn(250)
            .fadeOut(1500)
            .scaleToObject(3)
            .randomRotation()
            .opacity(0.5)
            .filter("ColorMatrix", { brightness: 0.8 })
            .zIndex(4)

            super.affectCommon()
            .file("jb2a.particles.outward.orange.01.03")
            .fadeIn(250, {ease: "easeOutQuint"})
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .fadeOut(5000, {ease: "easeOutQuint"})
            .opacity(1)
            .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
            .randomRotation()
            .scaleToObject(3)
            .duration(10000)
            .pause(500)

            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(3)
            .duration(1200)
            .fadeIn(200, {ease: "easeOutCirc", delay: 200})
            .fadeOut(300, {ease: "linear"})
            .filter("ColorMatrix", { saturate: -1, brightness: 2 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .zIndex(0.1)

            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(3)
            .fadeOut(5000, {ease: "easeOutQuint"})
            .duration(10000)
        }
        descriptorLeap(position){
            this.canvasPan()
                .shake({duration: 2000, strength: 5, rotation: false })
                super.affectCommon()
                .file("jb2a.impact.earth.01.browngreen")
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            super.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            super.affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(4)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            super.affectCommon()
                .file("jb2a.particles.outward.orange.01.03")
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(5)
                .duration(10000)
                .pause(500)
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1)
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)

            return this
        }
        descriptorProtection(){
            this.earthBuff()
                .file("jb2a.shield_themed.above.molten_earth.01.orange")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
            //  .persist()
            super.affectCommon()
                .file("jb2a.shield_themed.above.molten_earth.03.orange")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
            //    .persist()
            return this
        }
        descriptorSpeed(position){
            return this.descriptorFlight(position)
        }
        descriptorTeleport(position){
            return this.descriptorBurrowing(position)
        }
        descriptorWeaken(position){
                this.file("animated-spell-effects-cartoon.water.ball")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.2)
                .fadeIn(500)
                .fadeOut(500)
                .tint("#43270F")
                .filter("ColorMatrix", { hue: 0, contrast: 0, saturate: 0 , brightness: 1 })
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                // .persist()
                    return this
        }
    }
    class ElectricityEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class EnergyEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class EntropyEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class ExoskeletonEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                let targetCenter = {
                x: this.affected.x+canvas.grid.size*this.affected.document.width/2,
                y: this.affected.y+canvas.grid.size*this.affected.document.width/2,
                };
                
                const tokenCenter = {
                x: this.caster.x+canvas.grid.size*this.caster.document.width/2,
                y: this.caster.y+canvas.grid.size*this.caster.document.width/2,
                };
                
                const middleposition = {
                    x: (targetCenter.x - tokenCenter.x)* 0.25,
                    y: (targetCenter.y - tokenCenter.y)* 0.25,
                };
                
                super.castCommon()
                    .file("jb2a.unarmed_strike.no_hit.01.blue")
                    .atLocation(this.caster, { edge: "outer" })
                    .stretchTo(this.affected)
                    .filter("Glow", { color: "#0d0d0c", distance: 1, outerStrength: 5, innerStrength: 0 })
                    .scale(3)
                    .playbackRate(0.5)
                    .fadeOut(100)
                    .zIndex(2)
                
                    .sound("https://assets.forge-vtt.com/bazaar/modules/lancer-weapon-fx/assets/soundfx/DD288Ready.ogg")
                        .delay(0)
                    
                super.castCommon()
                    .file("jb2a.token_border.circle.static.blue.012")
                    .opacity(0.75)
                    .scaleToObject(2)
                    .filter("ColorMatrix", {saturate: 0})
                    .fadeIn(500)
                    .duration(1500)
                    .belowTokens()
                    .fadeOut(250)
                
                super.castCommon()
                    .file("jb2a.particles.inward.blue.01.01")
                    .opacity(0.35)
                    .scaleToObject(1.5)
                    .filter("ColorMatrix", {saturate: 1})
                    .fadeIn(500)
                    .duration(1500)
                    .mask(this.caster)
                    .fadeOut(250)
                
                super.castCommon()
                    .file("animated-spell-effects-cartoon.cantrips.mending.yellow")
                    .scaleToObject(3)
                    .opacity(0.75)
                    .filter("ColorMatrix", { saturate: -1, brightness: 2, hue: -185 })
                    .zIndex(1)
                    .waitUntilFinished(-1000)
                    
                    .wait(750)
                    
                    .canvasPan()
                    .delay(250)
                    .shake({duration: 250, strength: 2, rotation: false })
                
                super.castCommon()
                    .file("jb2a.swirling_leaves.outburst.01.pink")
                    .scaleIn(0, 500, {ease: "easeOutCubic"}) 
                    .filter("ColorMatrix", { saturate: 1, hue: -105 })
                    .scaleToObject(0.75)
                    .fadeOut(2000)
                    .zIndex(1)
                
                .animation()
                    .on(this.caster)
                    .opacity(0)
                
                super.castCommon()
                    .from(this.caster)
                    .atLocation(this.caster)
                    .mirrorX(this.caster.document.mirrorX)
                    .animateProperty("sprite", "position.x", { from: 0, to: middleposition.x, duration: 100, ease:"easeOutExpo"})
                    .animateProperty("sprite", "position.y", { from: 0, to: middleposition.y, duration: 100, ease:"easeOutExpo"})
                    .animateProperty("sprite", "position.x", { from: 0, to: -middleposition.x, duration: 350, ease:"easeInOutQuad", fromEnd:true})
                    .animateProperty("sprite", "position.y", { from: 0, to: -middleposition.y, duration: 350, ease:"easeInOutQuad", fromEnd:true})
                    .scaleToObject(1, {considerultramarineTokenScale: true})
                    .duration(600)
                
                .animation()
                    .on(this.caster)
                    .opacity(1)
                    .delay(600)
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this.file("jb2a.impact.010.blue")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(2.5)
            .atLocation(target)
            .randomRotation()
            .playSound("https://assets.forge-vtt.com/bazaar/modules/lancer-weapon-fx/assets/soundfx/HeavyImpact.ogg")
            .delay(1000)
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
                this.file("jb2a.impact.ground_crack.blue.02")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(2.5)    
            .randomRotation()
            .belowTokens()        
            .effect()
            .delay(200)
            .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(1.75)
            .opacity(0.5)
        
            .belowTokens()
            
            super.affectCommon()
            .delay(200)
            .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(2.5)
            .opacity(0.5)
        
            .belowTokens()
                
            super.affectCommon()
            .from(target)
            .fadeIn(200)
            .fadeOut(500)
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .scaleToObject(target.document.texture.scaleX)
            .duration(1500)
            .opacity(0.25);
            
            
            return this;
        }
        descriptorHealing(){
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }

    class FireEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
            this.leaves = 'orangepink'
        }
        castDamage({affected,caster}={}) {
            return super.castCommon({affected:affected, caster:caster, rotation:false})
                    .file("animated-spell-effects-cartoon.fire.03") // Fire casting animation
                    .spriteOffset({ x: 15, y: 0 })
                    .scale(0.3)
                //   .waitUntilFinished(-1000)
                .file("modules/animated-spell-effects-cartoon/assets/spell-effects/cartoon/fire/fire_55_800x800.webm") // Fireball projectile
                    .scale(0.08)
                    .zeroSpriteRotation(true)
                    .fadeIn(100)
                    .fadeOut(50)
                
                
        }
        cast({caster, affected , duration = 1}={}){
                super.castCommon({caster:caster, affected:affected})
            .file("animated-spell-effects-cartoon.fire.03")
                .spriteOffset({ x: 15, y: 0 })
                .playbackRate(1)
                .scale(0.3)
                .waitUntilFinished(-1000)
            super.cast()
                .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/fire/fire_55_800x800.webm")
                .scale(0.08)
                .zeroSpriteRotation(true)
                .attachTo(this.caster, { bindVisibility: false })
                .name("Fire_attack")
                .duration(2000)
                .fadeIn(100)
                .fadeOut(50)
                .spriteOffset({ x: 20, y: 0 })
                .scaleIn(0, 500, {ease: "easeOutCubic"})
                .zeroSpriteRotation(true)
                .waitUntilFinished(-100)
            return this;
        }
        cast2({caster, affected , duration = 1}={}){
                super.castCommon({caster:caster, affected:affected})
            .file("animated-spell-effects-cartoon.fire.03")
                .playbackRate(1)
                .spriteOffset({ x: -10, y: 0 })
                .scale(0.5)
                .waitUntilFinished(-1000)
            return this;
        }
        castRange({caster, affected , duration = 1}={}){
                super.cast({caster:caster, affected:affected})
            .file("animated-spell-effects-cartoon.fire.19")
            .playbackRate(1)
            .scale(0.3)
            .waitUntilFinished(-800)
                    
            super.cast()
            .file("jb2a.cast_generic.fire.side01.orange.0")
            .playbackRate(1)
            .scaleToObject(1.5)
            .rotateTowards(this.affected)
            .anchor({ x: 0.4, y: 0.5 })
            .waitUntilFinished(-100)
            .duration(600)
            return this;
        }
        descriptorCast(){
            return this.file("animated-spell-effects-cartoon.fire.19")
                .playbackRate(1)
                .scale(0.3)
                .waitUntilFinished(-800)
        }
        descriptorCastBurrowing(position) { 
            let hue = -0
        
            let saturate = 0
            let tint = "#dc7118"

            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
                .scaleToObject(2.25)
                .fadeOut(300)
                .tint(tint)
                .filter("ColorMatrix", { saturate: saturate })
                .animateProperty("sprite", "width", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "height", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "width", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .animateProperty("sprite", "height", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .playbackRate(2)
                .belowTokens()

            super.affectCommon()
                .delay(1300)
                .file("jb2a.impact.fire.01.orange.0")
                .size(3, {gridUnits:true})
                .belowTokens()
                .opacity(0.5)
                .waitUntilFinished(-2000)

            super.affectCommon()
                .file("jb2a.impact.earth.01.browngreen.0")
                .scaleToObject(4)
                .opacity(0.8)

                .pause(500)



            super.affectCommon()
                .file("jb2a.spell_projectile.earth.01.browngreen.05ft")
                .opacity(1)
                .scale(this.caster.w / canvas.grid.size)
                .stretchTo(position)
                .tint(tint)
                .filter("ColorMatrix", { hue: hue })
                .zIndex(1) 
                .pause(300)
            return this
        }
        descriptorCastFlight(position){
            this.file("animated-spell-effects-cartoon.fire.spiral")
            .randomSpriteRotation()
            .playbackRate(1)
            .scale(0.5)
            super.castCommon()
                .file("animated-spell-effects-cartoon.fire.118")
                .anchor({ x: 0.5, y: 0.66 })
                .playbackRate(1)
                .scale(0.5)
            super.castCommon()
                .file("jb2a.particle_burst.01.circle.yellow")
                .filter("ColorMatrix", {hue: 0, contrast: 0.5, saturate: 0})
                .opacity(0.8)
                .tint("#dc7118")
                .playbackRate(1.5)
                .randomSpriteRotation()
                .scaleToObject(3)
                .waitUntilFinished(0)      
            super.castCommon()
                .file("jb2a.impact.fire.01.orange.0")
                .size({ width: this.affected.document.width * 2.5, height: this.affected.document.width * 2.45 }, { gridUnits: true })
                .belowTokens()
                .filter("ColorMatrix", { hue: -10 })
                .zIndex(1)
                .pause(10)
            .castCommon()
                .file("animated-spell-effects-cartoon.smoke.105")
                .opacity(1)
                .scaleToObject(2)
                .tint("c1f8f6")
                .belowTokens() 
                super.castCommon()
                this.file("jb2a.gust_of_wind.default")
                    .opacity(1)
                    .tint("#1c1c1c")
                    .scale(this.affected.w / canvas.grid.size)
                    .stretchTo(position)
                    .belowTokens()
                    .zIndex(1)
            
            return this
        }
        descriptorCastLeaping(position){
            
            let    hue = -0
            let    leaves = 'orangepink'
            let    saturate = 0
            let    tint = "#941414"
                
            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: saturate })
            .animateProperty("sprite", "width", { from: this.caster.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.caster.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.caster.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.caster.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens() 
            .tint(tint)

            super.castCommon()
            .delay(1300)
            .file("modules/animated-spell-effects/spell-effects/fire/fire_circle_CIRCLE_01.webm")
            .size(3, {gridUnits:true})
            .opacity(0.8)
            .pause(2000)

            super.castCommon()
            .file("animated-spell-effects-cartoon.air.puff.03")
            .scaleToObject(1.75)
            .tint("#1c1c1c")
            .belowTokens()
            .zIndex(1)

            super.castCommon()
            .file("jb2a.ground_cracks.orange.01")
            .scaleToObject(1.75)
            .duration(3000)
            .fadeIn(100)
            .fadeOut(1000)
            .belowTokens()

            super.castCommon()
            .file("jb2a.impact.ground_crack.still_frame.01")
            .scaleToObject(1.75)
            .duration(6000)
            .fadeIn(100)
            .fadeOut(1000)
            .belowTokens()

            super.castCommon()
            .file("jb2a.wind_stream.white")
            .anchor({ x: 0.5, y: .5 })
            .delay(4000)  
            .duration(1000) 
            .opacity(1)
            .scale(this.caster.w / canvas.grid.size * 0.025)
            .moveTowards(position)
            .mirrorX()
            .zIndex(1)
            .pause(100)

            return this
        
        }
        descriptorCastTeleport(position){
            let hue = -0
            let leaves = 'orangepink'
            let saturate = 0
            let tint = "#dc7118"
            
            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: saturate })
            .animateProperty("sprite", "width", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens()
            .tint(tint)

            .castCommon()
            .file("animated-spell-effects-cartoon.fire.spiral")
            .playbackRate(1)
            .delay(1000)
            .scale(0.5)

            .castCommon()
            .file("animated-spell-effects-cartoon.fire.spiral")
            .playbackRate(1)
            .delay(4000)
            .scale(0.5)

            .castCommon()
            .delay(1300)
            .file("jb2a.impact.fire.01.orange.0")
            .size(3, {gridUnits:true})
            .belowTokens()
            .opacity(0.5)
            .waitUntilFinished(-2000)

            .castCommon()
            .file("jb2a.misty_step.01.orange")
            .scaleToObject(1.5)
            .filter("ColorMatrix", { hue: hue })
            .opacity(0.8)
            return this

        }
        descriptorCastSpeed(position){
            
            this.file("animated-spell-effects-cartoon.fire.spiral")
                .randomSpriteRotation()
                .playbackRate(1)
                .delay(0)
                .scale(0.5)
            super.castCommon()
                .file("jb2a.particle_burst.01.circle.yellow")
                .filter("ColorMatrix", {hue: 0, contrast: 0.5, saturate: 0})
                .opacity(0.8)
                .tint("#dc7118")
                .playbackRate(1.5)
                .randomSpriteRotation()
                .scaleToObject(3)
                .pause(800)
            super.castCommon()
                .file("animated-spell-effects-cartoon.air.puff.01")
                .tint("#1c1c1c")
                .scaleToObject(4)
                .pause(200)
            super.castCommon()
                .file("jb2a.template_line.lava.01.orange.15ft")
                .filter("ColorMatrix", {saturate: 0, contrast: 0.5})
                .playbackRate(2.5)
                .stretchTo(position, {cacheLocation: true})
                .belowTokens()
                .fadeOut(1000)
            super.castCommon()
                .file("jb2a.template_line_piercing.generic.01.orange.15ft")
                .filter("ColorMatrix", { hue: 15, saturate: -0.6, contrast: 2})
                .opacity(0.6)
                .playbackRate(1.5)
                .spriteOffset({x: -3.5}, {gridUnits: true})
                .stretchTo(position, {cacheLocation: true})
                .pause(200)
            super.castCommon()
                this.file("animated-spell-effects-cartoon.smoke.99")
                .tint("#1c1c1c")
                .filter("ColorMatrix", {brightness: 1, contrast: 1.5})
                .spriteOffset({ x: -3, y: -1 }, { gridUnits: true })
            .rotateTowards(this.affected)
                .rotate(90)
                    .stretchTo(position)
                .scaleToObject(5, {considerTokenScale: true})
                
            return this
        }
        descriptorMeleeCast(){
            this.file("animated-spell-effects-cartoon.fire.19")
                .playbackRate(1)
                .scale(0.4)
                
            this.castCommon({rotation:false})
                .file("animated-spell-effects-cartoon.fire.19")
                .playbackRate(1)
                .scale(0.4)
                .delay(800)
                .waitUntilFinished(-1200)
                
            this.castCommon({rotation:false})
                .file("jb2a.flurry_of_blows.no_hit.yellow")
                .stretchTo(this.affected)
                .playbackRate(1)
                .pause(800)
            return this;
        }

        coneBreath({affected, caster}={}){
            this.coneCommon(affected, caster).file("jb2a.breath_weapons.fire.cone.orange.01")
                .fadeIn(100)
                .fadeOut(100)
                .delay(1000)
                .playbackRate(1.5)
            .coneCommon()
                .file("jaamod.breath_weapon.dragon_born_silver_white_cold15_cone")
                .filter("ColorMatrix", { saturate: -1,brightness: 2, contrast:1})
                .tint("#dc7118")  
                .duration(3350)
                .fadeOut(250)
                .delay(800)
                .fadeIn(10, {delay:2700})
                .aboveLighting()
                .zIndex(1)
            
                .canvasPan()
                .delay(3900)
                .shake({duration: 5000, strength: 1, rotation: false })
                return this

        }
        
        burst({affected,persist=true}={})
        {
                super.burstCommon({affected:affected})
                    .file("jb2a.impact.fire.01.orange.0")
                    .playbackRate(1)
                    .scaleToObject(2.5)
                return this
        }

        burstheal({affected,persist=true}={})
        {
            super.burstCommon({affected:affected})
                    .file("jb2a.healing_generic.burst.yellowwhite")
                    .tint("#dc7118")
                    .scaleToObject(1.2)
                return this
        }
        descriptorBurst() {
            return this
                .file("jb2a.impact.fire.01.orange.0")
                
                .playbackRate(1)
                .scaleToObject(2.5)
                .waitUntilFinished(-2000)
        }
        descriptorLine() {
            super.lineCommon()
                .file("jb2a.template_line.lava.01.orange")
                .spriteScale(0.5)
                .playbackRate(0.6)
                .belowTokens()
                .fadeIn(50)
                .fadeOut(50)
            return this
        }
        descriptorCone() { 
            

            this.mm3eEffect()
            .file("jb2a.impact.fire.01.orange.0")
            .atLocation(this.templateStart)
            .scaleToObject(2)
            .fadeIn(100)
            .fadeOut(100)
            .waitUntilFinished(-5000)

            this.coneCommon()
            .file("animated-spell-effects-cartoon.fire.14")
            .fadeIn(100)
            .fadeOut(100)
            .waitUntilFinished()
            return this
        }
        
        descriptorProject({caster, target }={}){ 
            this.file("animated-spell-effects-cartoon.fire.29")
                .spriteOffset({ x: 20, y: 0 })
                .playbackRate(1)
                .scale(1)
                .waitUntilFinished(-2000)
            return this;
        }
        projectRange({caster, target }={}){ 
            super.projectCommon({caster:caster,target:target})
                .file("jb2a.fire_bolt.orange")
                .playbackRate(1)
                .waitUntilFinished(-100)
                .duration(600)
                .scale(1)
            return this;
        }
        projectRay({caster, target }={}){
            super.projectCommon({caster:caster,target:target})
                .file("jb2a.scorching_ray.01.orange")
                .playbackRate(1)
                .scale(1.5)
                .waitUntilFinished(-1000)
            return this;
        }
        projectDamage(){
            return super.projectCommon({affected:this.affected, caster:this.caster})
                .file("jb2a.scorching_ray.01.orange")
                .playbackRate(1)
                .scale(1.5)
                .waitUntilFinished(-1000)
        }
        projectBolt({affected,caster}={}){
            return super.projectCommon({affected:affected, caster:caster})
                .file("jb2a.fire_bolt.orange")
                .playbackRate(1)
                .waitUntilFinished(-100)
                .duration(400)
                .scale(1)
        }

        projectBall({caster, target }={}){
            super.projectCommon({caster:caster,target:target})
            .file("jb2a.fireball.beam.orange")
            .pause(2200)
            return this
        }
        descriptorProject() {
            
            return this.file("animated-spell-effects-cartoon.fire.29")
                .spriteOffset({ x: 20, y: 0 })
                .playbackRate(1)
                .waitUntilFinished(-2000)
        }
        descriptorProjectToLine() {
            return this.file("animated-spell-effects-cartoon.fire.29")
                .fadeIn(100)
                .fadeOut(100)
                //  .pause(600)
        }
        descriptorProjectToCone() {
            
            return this.descriptorProjectToLine()
        } 

        descriptorAura(){
            return this.file("animated-spell-effects-cartoon.level 02.flaming sphere")
                .anchor({x:0.5 , y:0.7, gridUnits:true})
                .delay(400)
                .scale(0.4)
        }
        descriptorAffliction() {
            this.file("animated-spell-effects-cartoon.fire.spiral")
                .playbackRate(1)
                .scale(0.5)
                .waitUntilFinished(-2500)
                
            
            super.affectCommon()
                .file("jb2a.shield_themed.below.fire.01.orange")
                .attachTo(this.affected)
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
                .persist()
            
            super.affectCommon()
                .file("jb2a.shield_themed.above.fire.03.orange")
                .attachTo(this.affected)
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .persist()
            return this;
        }
        descriptorBurrowing(position){
            this.file("jb2a.impact.earth.01.browngreen.0")
            .atLocation(this.caster)
            .scaleToObject(4)
            .opacity(0.8)

            super.affectCommon()
            .file("jb2a.burrow.out.01.brown.1")
            .atLocation(this.affected)
            .opacity(0.8)
            .belowTokens()
            .scaleToObject(4)
            .zIndex(1)

            .animation()
            .delay(1400)
            .on(this.affected)
            .fadeIn(200)


            super.affectCommon()
            .file("jb2a.ground_cracks.orange.01")
            .atLocation(this.affected)
            .opacity(0.9)
            .scaleToObject(3)
            .fadeIn(100)
            .fadeOut(1000)
            .duration(3000)
            .belowTokens()
            .waitUntilFinished(-2000)
            return

        }
        descriptorDamage() {
            this.file("animated-spell-effects-cartoon.mix.fire earth explosion.06") // Explosion effect
                .scale(0.8)
                .fadeIn(300)
                .fadeOut(300)
            super.affectCommon()
                .file(`jb2a.ground_cracks.orange.01`)
                .scaleToObject(2)
                .fadeIn(600)
                .opacity(1)
                .belowTokens()
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .filter("ColorMatrix", { hue: 0 })
                .fadeOut(500)
                .duration(8000)
                
            super.affectCommon()
                .file("jb2a.impact.ground_crack.still_frame.01")
                .scaleToObject(2)
                .fadeIn(600)
                .opacity(1)
                .belowTokens()
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .filter("ColorMatrix", { hue: 0 })
                .fadeOut(500)
                .duration(12000)
                
                .canvasPan()
                .shake({duration: 800, strength: 1, rotation: false })

            return this;
        }
        descriptorDeflection(){
            this.deflectionAnimation='jb2a.bullet.Snipe.orange.05ft'
            this.file("jb2a.impact.fire.01.orange.0")
            .scaleToObject(3)
            .fadeIn(500)
            .fadeOut(500)
            .waitUntilFinished(-1800)

            .effect()
            .file("jb2a.shield_themed.above.molten_earth.01.dark_orange")
            .scaleToObject(1.5)
            .fadeIn(500)
            .fadeOut(500)

            .effect()
            .file("jb2a.shield_themed.above.fire.03.orange")
            .scaleToObject(1.5)
            .fadeIn(500)
            .fadeOut(500)
            .play();

            this.initalizeRandomNumbers();
        }
        descriptorFlight(position){
            
            super.affectCommon()
                .from(this.affected)
                .file("jb2a.markers.on_token_mask.complete.01.orange")
                .name("Fly")
                .attachTo(this.affected, { bindAlpha: false, followRotation: true, locale: true })
                .rotate(180)
                .scaleToObject(1, { considerTokenScale: true })
                .opacity(1)
                .duration(800)
                .anchor({ x: this.affected.document.texture.scaleX * 0.5, y: 0.5 })
                .animateProperty("sprite", "position.y", { from: 50, to: 40, duration: 500, ease: "easeOutBack" })
                .loopProperty("sprite", "position.y", { from: 0, to: -5, duration: 2500, pingPong: true, delay: 1000 })
                .zIndex(2)
            //    .persist()

                super.affectCommon()
                .name("Fly")
                .scaleToObject(1.35, { considerTokenScale: true })
                .attachTo(this.affected, { bindAlpha: false })
                .opacity(1)
                .duration(800)
                .filter("ColorMatrix", { hue: 132, saturate: -1 })
                .anchor({ x: this.affected.document.texture.scaleX * 0.55, y: 0.8 })
                .animateProperty("sprite", "position.y", { from: 50, to: -10, duration: 500, ease: "easeOutBack" })
                .loopProperty("sprite", "position.y", { from: 0, to: -50, duration: 2500, pingPong: true, delay: 1000 })
                .fadeIn(1000)
                .zIndex(2.2)
                //   .persist()
            
                super.affectCommon()
                .from(this.affected)
                .name("Fly")
                .scaleToObject(0.9)
                .duration(1000)
                .opacity(0.5)
                .belowTokens()
                .filter("ColorMatrix", { brightness: -1 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .attachTo(this.affected, { bindAlpha: false })
                .zIndex(1)
                //.persist()
        super.affectCommon()
            this.file("jb2a.impact.fire.01.orange.0")
            .opacity(1)
            .scaleToObject(6)
            .aboveLighting()
            .zIndex(1)
        //  .delay(100)
        
        return this
        }
        descriptorHealing(){
            this.file("jb2a.healing_generic.loop.greenorange")
                    .playbackRate(1)
                    .scaleToObject()
                    .tint("#dc7118")
                    .scale(1.8)
                    .fadeIn(500)
                    .filter("Glow", {distance: 0.5})
                    .playSound("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-long-4.mp3")
                return this
        }
        descriptorInsubstantial(){
            this.file("animated-spell-effects-cartoon.fire.01")
            .anchor({x:0.5 , y:0.7, gridUnits:true})
            .delay(400)
            .scale(0.4)

            super.affectCommon()
                .file("jb2a.impact.fire.01.orange.0")
                .delay(800)
                .scale(0.8)

            super.affectCommon()
                .file("animated-spell-effects-cartoon.fire.13")
                .anchor({x:0.5 , y:0.7, gridUnits:true})
                .delay(1000)
                .scale(0.3)

                .play();
                    return this
        }
        descriptorLeap(position){
            super.affectCommon()
            this.file("animated-spell-effects-cartoon.air.puff.03")
            .tint("#1c1c1c")
            .scaleToObject(2.5)
            .belowTokens()
            .zIndex(1)

            super.affectCommon()
            .file("jb2a.ground_cracks.orange.01")
            .scaleToObject(1.75)
            .duration(3000)
            .fadeIn(100)
            .fadeOut(1000)
            .belowTokens()

            super.affectCommon()
            .file("jb2a.impact.ground_crack.still_frame.01")
            .scaleToObject(1.75)
            .duration(6000)
            .fadeIn(100)
            .fadeOut(1000)
            .belowTokens()
            return this
        }
        descriptorProtection(){
            this.file("jb2a.impact.fire.01.orange.0")

            .playbackRate(1)
            .scale(0.5)
            .affectCommon()
            .file("jb2a.shield_themed.above.molten_earth.03.dark_orange")
            .scaleToObject(1.5)
            .fadeIn(500)
            .fadeOut(500)

            .affectCommon()
            .file("jb2a.shield_themed.above.fire.03.orange")
            .scaleToObject(1.5)
            .fadeIn(500)
            .fadeOut(500)
        }
        descriptorSpeed(position){
            
            return this
        }
        descriptorTeleport(position){ 
            
                let hue = -0
                let saturate = 0
                let tint = "#dc7118";

            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .atLocation(this.affected)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: saturate })
            .animateProperty("sprite", "width", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens()
            .tint(tint)

            .pause(1000)

            this.affectCommon()
            .file("jb2a.misty_step.02.orange")
            .filter("ColorMatrix", { hue: hue })
            .opacity(0.8)
            .scaleToObject(1.5)

            .animation()
            .delay(1400)
            .on(this.caster)
            .fadeIn(200)
            .waitUntilFinished(-750)

            this.affectCommon()
            .file("jb2a.ground_cracks.orange.01")
            .opacity(0.9)
            .scaleToObject(3)
            .duration(3000)
            .fadeIn(100)
            .fadeOut(1000)
            .belowTokens()

            .affectCommon()
            .file("jb2a.impact.ground_crack.still_frame.01")
            .opacity(0.9)
            .scaleToObject(3)
            .duration(4000)
            .fadeIn(100)
            .fadeOut(1000)
            .belowTokens()

            return this
        }
            /*
        

            descriptorConcealment()
            {
                return this;
            }
        


            descriptorIllusion(){
                return this
            }
        

            descriptorMindControl(){
                return this
            }

            descriptorMindControl(){
                return this
            }

            descriptorNullify(){
                return this
            }



            descriptorTransform(){
                return this
            }

            descriptorWeaken(){
                return this
            }*/
    }
    class GasEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

        }
        class HolyEffectSection extends TemplatedDescriptorEffect {
            constructor(inSequence) {
                super(inSequence);
            }
            cast({caster, affected , duration = 1}={}){ 
                super.castCommon({caster:caster, affected:affected})
                    super.castCommon()
                        .file(`jb2a.bless.400px.intro.yellow`)
                        .opacity(1)
                        .size({ width: 2.5, height: 2.5 }, {gridUnits: true})
                        .fadeIn(1000, {ease: "easeInExpo"})
                        .fadeOut(2500, {ease: "easeInExpo"})
                        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000})
                        .scaleIn(0, 3000, {ease: "easeOutBack"})
                        .scaleOut(0, 3000, {ease: "easeInBack"})
                        .belowTokens()
                        .duration(5000)
                        .zIndex(1)
                    
                    super.castCommon()
                        .file("jb2a.cast_generic.01.yellow.0") 
                        .playbackRate(0.5)
                        .scale(1)
                        .opacity(0.6)
                        .delay(500)
                        .fadeIn(500)
                        .fadeOut(800)
                        .belowTokens() 
                    
                    
                        .pause(1000)
                    
                        super.castCommon()
                        .file("jb2a.sacred_flame.source.yellow")
                        .scaleToObject(2.5)
                        .playbackRate(1)
                        .zIndex(3)
                    return this
            } 
            castSpecificEffect({caster, affected , duration = 1}={}){
                super.castCommon({caster:caster, affected:affected})
                //place sequencer logic
                    return this
            
            }
            meleeCast({caster, affected, repeats=1}={} ){
                super.meleeCastCommon({caster:caster, affected:affected}) 
                let target = Array.from(game.user.targets)[0];
    
        const targetCenter = {
        x: target.x+canvas.grid.size*target.document.width/2,
        y: target.y+canvas.grid.size*target.document.width/2,
        };
    
        const tokenCenter = {
        x: token.x+canvas.grid.size*token.document.width/2,
        y: token.y+canvas.grid.size*token.document.width/2,
        };
    
        const middleposition = {
        x: (targetCenter.x - tokenCenter.x)* 0.25,
        y: (targetCenter.y - tokenCenter.y)* 0.25,
        };
    
    
        this.effect()
        .file(`jb2a.bless.400px.intro.yellow`)
        .atLocation(token)
        .opacity(0.9)
        .size({ width: 2.5, height: 2.5 }, {gridUnits: true})
        .fadeIn(1000, {ease: "easeInExpo"})
        .fadeOut(2500, {ease: "easeInExpo"})
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000})
        .scaleIn(0, 3000, {ease: "easeOutBack"})
        .scaleOut(0, 3000, {ease: "easeInBack"})
        .belowTokens()
        .duration(5000)
        .zIndex(1)
    
        .wait(1000)
    
        this.effect()
        .file("jb2a.cast_generic.01.yellow.0")
        .atLocation(token) 
        .playbackRate(0.5)
        .scaleToObject(1.5)
        .delay(1000)
        .fadeOut(800)
        .waitUntilFinished(-1000) 
        .zIndex(2)
    
        this.effect()
        .file("jb2a.divine_smite.target.yellowwhite")
        .atLocation(target)
        .scaleToObject(2.5)
        .delay(100)
        .playbackRate(1.25)
        .fadeOut(100)
        .zIndex(2)
    
    
    
    
        .wait(750)
    
        .canvasPan()
        .delay(250)
        .shake({duration: 250, strength: 2, rotation: false })
    
        .animation()
        .on(token)
        .opacity(0)
    
        this.effect()
        .from(token)
        .atLocation(token)
        .mirrorX(token.document.data.mirrorX)
        .animateProperty("sprite", "position.x", { from: 0, to: middleposition.x, duration: 100, ease:"easeOutExpo"})
        .animateProperty("sprite", "position.y", { from: 0, to: middleposition.y, duration: 100, ease:"easeOutExpo"})
        .animateProperty("sprite", "position.x", { from: 0, to: -middleposition.x, duration: 350, ease:"easeInOutQuad", fromEnd:true})
        .animateProperty("sprite", "position.y", { from: 0, to: -middleposition.y, duration: 350, ease:"easeInOutQuad", fromEnd:true})
        .scaleToObject(1, {considerTokenScale: true})
        .duration(600)
    
        .animation()
        .on(token)
        .opacity(1)
        .delay(600)
    
        .playsound()
        .file("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-short-6.mp3")
        .fadeInAudio(500)
        .fadeOutAudio(500)
    
        .playsound()
        .file("modules/lancer-weapon-fx/soundfx/Axe_swing.ogg")
        .fadeInAudio(500)
        .fadeOutAudio(500)
    
        this.effect()
        .file("jb2a.impact.ground_crack.white.01")
        .scaleToObject(3)
        .atLocation(target)
        .randomRotation()
        .belowTokens()
    
        this.effect()
        .delay(200)
        .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
        .scaleIn(0, 100, {ease: "easeOutCubic"}) 
        .scaleToObject(1.75)
        .opacity(0.5)
        .atLocation(target)
        .belowTokens()
    
        this.effect()
        .delay(200)
        .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
        .scaleIn(0, 100, {ease: "easeOutCubic"}) 
        .scaleToObject(2.5)
        .opacity(0.5)
        .atLocation(target)
        .belowTokens()
    
        this.effect()
        .from(target)
        .atLocation(target)
        .fadeIn(200)
        .fadeOut(500)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .scaleToObject(target.document.texture.scaleX)
        .duration(3000)
        .opacity(0.25)
                return this
            }
    
            project({caster, target }={}){ 
                super.projectCommon({caster:caster,target:target})
                //play sequencer logic
                return this;
                }
    
    
            burst({affected,persist=true}={})
            {
                super.burstCommon({affected:affected})
        .file("jb2a.ground_cracks.orange.01")
        .scaleToObject(1.2)
        .fadeIn(600)
        .opacity(1)
        .belowTokens()
        .scaleIn(0, 60, {ease: "easeOutCubic"})
        .filter("ColorMatrix", { hue: 0 })
        .fadeOut(500)
        .delay(3000)
        .duration(8000)
    
        super.burstCommon()
        .file("jb2a.sacred_flame.target.yellow")
        .scaleToObject(1.5)
        .playbackRate(1)
        .delay(800)
        .zIndex(3)
        .aboveLighting()
        .waitUntilFinished(-3000)
    
        super.burstCommon()
        .file("jb2a.template_circle.out_pulse.02.burst.yellowwhite")
        .scaleToObject (1.5)
        .scaleIn(0, 500, {ease: "easeOutQuint"})
        .zIndex(2)
                return this
            }
    
            burstheal({affected,persist=true}={})
            {
                super.burstCommon({affected:affected})
        .file("jb2a.sacred_flame.source.yellow")
        .scaleToObject(1.5)
        .playbackRate(1)
        .delay(800)
        .zIndex(3)
        .aboveLighting()
        
        .wait(3000)
    
    super.burstCommon()        
        .file("jb2a.template_circle.out_pulse.02.burst.yellowwhite")
        .scaleToObject (1.5)
        .scaleIn(0, 500, {ease: "easeOutQuint"})
        .zIndex(2)
                return this
            }
            line({affected}={}) {
    
        const template = canvas.templates.placeables.at(-1).document;
    
        const lineTemplate = canvas.templates.placeables.at(-1).document;
    
        const start = { x: lineTemplate.data.x, y: lineTemplate.data.y };
                
                super.lineCommon({affected:affected})
        this.effect()
        .file("jb2a.sacred_flame.target.yellow")
        .atLocation(start) 
        .scaleToObject(3.5)
        .playbackRate(1)
        .aboveLighting()
        .zIndex(3)
    
        this.effect()
        .file("jb2a.eldritch_blast.yellow")
        .atLocation(start)
        .spriteScale(0.5)
        .stretchTo(template)
        .aboveLighting()
        .delay(1200)
        .fadeIn(50)
        .fadeOut(50)
    
                return this;
            }
                lineHealing({affected}={}) {
    
        const template = canvas.templates.placeables.at(-1).document;
    
        const lineTemplate = canvas.templates.placeables.at(-1).document;
    
        const start = { x: lineTemplate.data.x, y: lineTemplate.data.y };
                
                super.lineCommon({affected:affected})
        this.effect()
        .file("jb2a.sacred_flame.target.yellow")
        .atLocation(start) 
        .scaleToObject(3.5)
        .playbackRate(1)
        .aboveLighting()
        .zIndex(3)
    
        this.effect()
        .file("animated-spell-effects-cartoon.magic.helix")
        .atLocation(start)
        .spriteScale(0.5)
        .playbackRate(0.8)        
        .stretchTo(template)
        .aboveLighting()
        .delay(2200)
        .fadeIn(50)
        .fadeOut(50)
    
                return this;
            }
            cone({affected} = {}) {
                const coneStart = { x: this.affected.data.x, y: this.affected.data.y };
               const template = canvas.templates.placeables.at(-1).document;
                   
        super.coneCommon({affected:affected})               
        .file("jb2a.breath_weapons02.burst.cone.holy.yellow.01")
        .atLocation(coneStart, { offset: { x: 0, y: 0.5 } })
        .fadeIn(100)
        .fadeOut(100)
        .stretchTo(this.affected)            
        .delay(2800)
        //.filter("ColorMatrix", { hue: 40, saturate: 0, contrast: 0.2, brightness: 3})
        .playbackRate(1)
    
    super.affectCommon()
        .file("jb2a.sacred_flame.target.yellow")
        .atLocation(coneStart) 
        .scaleToObject(3.5)
        .playbackRate(1)
        .aboveLighting()
        .zIndex(3)    
        
        .canvasPan()
        .delay(3900)
        .shake({duration: 5000, strength: 1, rotation: false })
                return this;
            }
    
            affectAffliction({affected}={})
            {
                this.affectDamage({affected:affected})
            .delay(300)
            .file("jb2a.bless.400px.loop.yellow")
            .attachTo(this.affected, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
            .scaleToObject(2, { considerTokenScale: true })
            .fadeIn(1000)
            .fadeOut(500)
            .opacity(0.8)
            .belowTokens()
            .persist()
                return this;
            }
    
            affectAura({affected, duration=1, persist=false, scaleToObject = 1, spriteOffest={x:0, y:0}}={}){
                super.affectCommon({affected:affected})
                //play sequencer logic
                return this;
            }
    
            affectConcealment({affected}={})
            {
                this.affectAura({affected:affected, persist:true})
                //play sequencer logic
                return this;
            }
            
            affectDamage({affected = this.affected, repeats=1}={} ){ 
                this.affectCommon({affected: affected})
                    .from(this.affected)
                    .fadeIn(200)
                    .fadeOut(500)
                    .delay(800)
                    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                    .scaleToObject(this.affected.document.texture.scaleX)
                    .duration(3000)
                    .opacity(0.25)
    
                super.affectCommon()
                .file("jb2a.sacred_flame.target.yellow")
                .scaleToObject(3)
                .playbackRate(1)
                .delay(800)
                .zIndex(3)
                return this;
            }
    
            affectHealing({affected = this.affected|| this.firstSelected}={}){
                    this.affectAura({affected:affected, persist:false})
    
        .pause(2000)
    
        super.affectCommon()
        .from(this.affected)
        .fadeIn(200)
        .fadeOut(500)
        .delay(800)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .scaleToObject(this.affected.document.texture.scaleX)
        .duration(3000)
        .opacity(0.25)
    
        super.affectCommon()
        .file("jb2a.cure_wounds.400px.blue")
        .scale(0.8)
        .belowTokens()
    
        super.affectCommon()
        .file("jb2a.detect_magic.circle.yellow")
        .scaleToObject(1.6)
        .mask()
        .delay(500)
    
        .playSound("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-long-4.mp3")
                return this;
            }
    
            affectIllusion({affected = this.affected}={})
            {
                this.affectAura({affected:affected, persist:true})
                .pause(1000)
                //add extra custom sequencer logic
                super.affectIllusion({affected:affected})
    
                return this;
            }
    
            affectMindControl({affected = this.affected}={}){
                    this.affectAura({affected, scaleToObject:.6 , spriteOffest:{x:0, y:-30} , persist:true})
                    //add extra custom sequencer logic
                .pause(2000)
                super.affectMindControl(affected)
                return this
            }
    
            affectWeaken({affected = this.affected}={}){
                    this.affectAura({affected,  persist:true})
                    //add extra custom sequencer logic
                    .pause(1000)
                    super.affectWeaken(affected)
                return this
            }
    
            /* castCone({affected, caster}={}){
                return this
            }*/
    
            descriptorCast(){
                    return this
            }
            descriptorMeleeCast(){
                return this
            }
    
            descriptorProject() {
                return this;
            }
            descriptorProjectToLine() {
                return this.descriptorProject()
            }
            descriptorProjectToCone() {
                return this.descriptorProject()
            }   
    
            descriptorBurst() {
                return this;
            }
            descriptorLine() {
                return this
            }
            descriptorCone() {
                return this;
            }
            descriptorAffliction() {
                    
                return this;
            }
            descriptorAura(){
                return this
            }
            descriptorDamage(){
                return this;
            }
            descriptorHealing(){
                
                return this
            }
    
            /*
            
            descriptorAura(){
                return this
            }
    
            descriptorConcealment()
            {
                return this;
            }
    
            descriptorIllusion(){
                return this
            }
            descriptorInsubstantial(){
                return this
            }
    
            descriptorMindControl(){
                return this
            }
    
            descriptorMindControl(){
                return this
            }
    
            descriptorNullify(){
                return this
            }
    
            descriptorProtection(){
                return this
            }
    
            descriptorTransform(){
                return this
            }
    
            descriptorWeaken(){
                return this
            }*/
    
        }
    class IceEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
            this.leaves = 'pink'
            this.hue = 140
            this.saturate = -1 
        }

        descriptorCast(){
                return this
        }

        descriptorCastBurrowing(position) {
            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: this.saturate })
            .animateProperty("sprite", "width", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens()

            super.affectCommon()
            .delay(1300)
            .file("jb2a.impact_themed.ice_shard")
            .size(3, {gridUnits:true})
            .belowTokens()
            .opacity(0.5)
            .waitUntilFinished(-2000)

            super.affectCommon()
            .file("jb2a.impact.earth.01.browngreen.0")
            .scaleToObject(4)
            .filter("ColorMatrix", { hue: this.hue })
            .opacity(0.8)

            .pause(500)

            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .duration(5000)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
            .scaleToObject(6)
            .filter("ColorMatrix", { hue: this.hue })
            .zIndex(1)

            super.affectCommon()
            .file("jb2a.spell_projectile.earth.01.browngreen.05ft")
            .opacity(1)
            .scale(this.caster.w / canvas.grid.size)
            .stretchTo(position)
            .filter("ColorMatrix", { hue: this.hue })
            .zIndex(1)
            return this
        }
        descriptorCastFlight(position){
        
                this.castCommon()
            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
                .scaleToObject(4)
                .fadeOut(300)
                .filter("ColorMatrix", { saturate: this.saturate })
                .pause(3000)
            super.castCommon()
                .file("jb2a.gust_of_wind.default")
                .opacity(1)
                .stretchTo(position)
                .scale(this.affected.w / canvas.grid.size)
                .belowTokens()
                .zIndex(1)
            this.castCommon()
                .animateProperty("sprite", "width", { from: this.affected.document.width * 2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits: true, delay: 500 })
                .animateProperty("sprite", "height", { from: this.affected.document.width * 2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits: true, delay: 500 })
                .animateProperty("sprite", "width", { from: 0, to: this.affected.document.width * 2.25, duration: 500, ease: "easeOutCubic", gridUnits: true, delay: 2500 })
                .animateProperty("sprite", "height", { from: 0, to: this.affected.document.width * 2.25, duration: 500, ease: "easeOutCubic", gridUnits: true, delay: 2500 })
                .playbackRate(2)
                .belowTokens() 
            super.castCommon()
                .file("jb2a.impact_themed.ice_shard.blue")
                .size({ width: this.caster.width * 2.5, height: this.caster.width * 2.45 }, { gridUnits: true })
                .belowTokens()
                .filter("ColorMatrix", { hue: -10 })
                .zIndex(1)
            super.castCommon()
                .file("animated-spell-effects-cartoon.smoke.105")
                .opacity(1)
                .scaleToObject(2)
                .tint("c1f8f6")
                .belowTokens()
                return this
        }
        descriptorCastLeap(position){

            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .atLocation(this.caster)
            .scaleToObject(4)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: this.saturate })
            .animateProperty("sprite", "width", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens() 
            .pause(2000)
        super.castCommon()
            .file("jb2a.impact_themed.ice_shard")
            //  .size(3, {gridUnits:true})
            .belowTokens()
            .opacity(0.8)
        super.castCommon()
            .file("animated-spell-effects-cartoon.air.puff.03")
            .scaleToObject(1.75)
            .tint("C1F8F6")
            .belowTokens()
        super.castCommon()
            .file("jb2a.wind_stream.white")
            .anchor({ x: 0.5, y: .5 })
            // .delay(4000)  
            //  .duration(1000) 
            .opacity(1)
            .scale(this.caster.w / canvas.grid.size * 0.085)
            .moveTowards(position)
            .mirrorX()
            .zIndex(1)
            return this
        }
        descriptorCastSpeed(position){
                this.file("jb2a.energy_strands.in.blue")
                .filter("ColorMatrix", {contrast: 0.8, saturate: -0.8})
                .fadeIn(1000)
                .randomSpriteRotation()
                .repeats(5, 5, 5)
                .scale(0.6)
                    .pause(2000)           
            super.castCommon()
                .file("jb2a.particle_burst.01.circle.green")
                .filter("ColorMatrix", {hue: 25, contrast: 0.5, saturate: -0.5})
                .opacity(0.8)
                .playbackRate(1.5)
                .randomSpriteRotation()
                .scaleToObject(3)
                .pause(2000) 
            super.castCommon()
                .file("animated-spell-effects-cartoon.air.puff.01")
                .scaleToObject(4)
                //   .waitUntilFinished(-2000)
            super.castCommon()
                .file("jb2a.template_line.ice.01.blue")
                .filter("ColorMatrix", {saturate: -4, contrast: 0.5})
                .playbackRate(2.5)
                .stretchTo(position, {cacheLocation: true})
                .belowTokens()
                .fadeOut(1700)
            super.castCommon()
                .file("jb2a.template_line_piercing.water.01.blue")
                .filter("ColorMatrix", { hue: 15, saturate: -0.6, contrast: 2})
                .opacity(0.6)
                .playbackRate(1.5)
                .spriteOffset({x: -3.5}, {gridUnits: true})
                .stretchTo(position, {cacheLocation: true})
            //    .waitUntilFinished(-1200)
            super.castCommon()
                .file("animated-spell-effects-cartoon.smoke.99")
                .tint(0xe8feff)
                .filter("ColorMatrix", {brightness: 1, contrast: 1.5})
                .spriteOffset({ x: -3, y: -1 }, { gridUnits: true })
                .rotateTowards(this.caster)
                .rotate(90)
                .scaleToObject(5, {considerTokenScale: true})
            //    .waitUntilFinished(-1500)
            return this
        }

        descriptorCastTeleport(position){
            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: this.saturate })
            .animateProperty("sprite", "width", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens()

            super.affectCommon()
            .delay(1300)
            .file("jb2a.impact_themed.ice_shard")
            .size(3, {gridUnits:true})
            .belowTokens()
            .opacity(0.5)
            .waitUntilFinished(-2000)

            super.affectCommon()
            .file("jb2a.misty_step.01.yellow")
            .scaleToObject(1.5)
            .filter("ColorMatrix", { hue: this.hue })
            .opacity(0.8)
            return this
        
        }
        descriptorMeleeCast(){
            this.file("jb2a.unarmed_strike.no_hit.01.blue")
            .stretchTo(this.affected)
            .playbackRate(1)
            .filter("Glow", {distance: 1})
            .pause(800)
            return this
        }
        castCone({affected, caster}={}){
            super.castCommon(affected, caster)
            this.file("jb2a.cast_generic.ice.01.blue.0")
                .scaleToObject(4)
                    .fadeIn(100)
                    .fadeOut(100)
                //    .spriteOffset({x:-100})
                .playbackRate(1.5)
            return this
        }
        descriptorProjectToCone() {
            this.descriptorProject()
            return this;
        }

        descriptorProject() {
            this.file("jb2a.ray_of_frost")
                .scale(1.5)
                .filter("Glow", { distance: 2 })
                .pause(800)
            return this;
        }
        descriptorProjectToLine() {
            
                this.descriptorProject()
        }

        descriptorBurst() {
            this.file("jb2a.impact.frost.blue.01")
                .belowTokens()
                .scaleToObject(1.5)
                .delay(800);
            super.affectCommon()
                .file("jb2a.ice_spikes.radial.burst.white")
                .scaleToObject(1.5)
                .filter("Glow", { distance: 5 })
                .delay(900);

            return this;
        }
        descriptorLine() {
            const center = 
            {x: (this.affected.document.object.ray.A.x 
                    + this.affected.document.object.ray.B.x)/2,
                y: (this.affected.document.object.ray.A.y 
                + this.affected.document.object.ray.B.y)/2}
            
            this.file("jb2a.impact_themed.ice_shard.01.blue")
                
                .delay(1000)

            super.affectCommon()
                .file("jb2a.healing_generic.burst.bluewhite")
                .scale(0.8)
                .delay(1300)
                
                
            super.affectCommon()
                .file("jb2a.impact_themed.ice_shard.01.blue")
                .atLocation(center)
                .delay(1800)
            
            super.affectCommon()
                .file("jb2a.healing_generic.burst.bluewhite")
                .scale(0.8)
                .delay(2300)
                
                super.affectCommon()
                .file("jb2a.template_line.ice.01.blue.60ft")
                .stretchTo(this.affected)
                .fadeIn(50)
                .fadeOut(50)
                .playbackRate(1)
                .delay(800)
        }

        descriptorCone(){
            this.file("jb2a.breath_weapons.cold.cone.blue")
            .fadeIn(100)
            .fadeOut(100)
            .delay(1650)
            .playbackRate(1.5)
            return this;
        }
        burstHealing(){
            this.burstCommon()
            .file("jb2a.impact_themed.ice_shard.01.blue")
            .atLocation(this.affected)
            .scaleToObject(1.5)
            .delay(1000)
            return this
            
        }

        descriptorAffliction() {
            this.file("jb2a.shield_themed.above.ice.01.blue")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, { ease: "easeOutCubic" })
                .scaleIn(0, 600, { ease: "easeOutCubic" })
                .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
                .filter("Glow", { distance: 5 })
                .persist();
                return this;
        }  
        descriptorAura(){
            this.file("jb2a.impact_themed.ice_shard.01.blue")
            .scaleToObject(4)
            return this
        }  
        descriptorBurrowing(position){
            let hue = 140 
        
            let saturate = -1

            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .atLocation(this.affected)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: saturate })
            .animateProperty("sprite", "width", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens()

            .pause(1000)

            super.affectCommon()
            .file("jb2a.impact.earth.01.browngreen.0")
            .atLocation(this.affected)
            .scaleToObject(4)
            .filter("ColorMatrix", { hue: hue })
            .opacity(0.8)

            super.affectCommon()
            .file("jb2a.burrow.out.01.brown.1")
            .atLocation(this.affected)
            .filter("ColorMatrix", { hue: hue })
            .opacity(0.8)
            .belowTokens()
            .scaleToObject(4)
            .zIndex(1)

            .animation()
            .delay(1400)
            .on(this.affected)
            .fadeIn(200)


            super.affectCommon()
            .file("jb2a.impact.frost.white.01")
            .atLocation(this.affected)
            .opacity(0.9)
            .scaleToObject(3)
            .belowTokens()
            .waitUntilFinished(-2000)

            return this
        }
        descriptorDeflection(){
            this.deflectionAnimation='jb2a.bullet.Snipe.blue.05ft'
            this.file("jb2a.impact_themed.ice_shard.01.blue")
                    .scaleToObject(2.5)
                    .fadeIn(500)
                    .fadeOut(500)
                super.affectCommon()
                    .file("jb2a.shield_themed.above.ice.03.blue")
                    .scaleToObject(1.5)
                    .fadeIn(500)
                    .fadeOut(500)
                    .filter("Glow", {distance: 3})
                    .delay(1000)
                return this
        }
        descriptorFlight(position){
            super.affectCommon()
                .file("jaamod.misc.snowfall_light")
                .name("Fly")
                .scaleToObject(1.35, { considerTokenScale: true })
                .opacity(1)
                .duration(800)
                .filter("ColorMatrix", { hue: 132, saturate: -1 })
                .anchor({ x: this.affected.document.texture.scaleX * 0.55, y: 0.8 })
                .animateProperty("sprite", "position.y", { from: 50, to: -10, duration: 500, ease: "easeOutBack" })
                .loopProperty("sprite", "position.y", { from: 0, to: -50, duration: 2500, pingPong: true, delay: 1000 })
                .fadeIn(1000)
                .zIndex(2.2)
                .persist()
            super.affectCommon()
                .from(this.affected)
                .name("Fly")
                .scaleToObject(0.9)
                .opacity(0.5)
                .belowTokens()
                .filter("ColorMatrix", { brightness: -1 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(1)
                .persist()
                .pause(1)
            super.affectCommon()
                .attachTo(this.affected)
                .file("jb2a.impact_themed.ice_shard.blue")
                .spriteOffset({ y: -1 }, { gridUnits: true })
                .opacity(1)
                .scaleToObject(8)
                .aboveLighting()
                .zIndex(1)
                return this
        }    

        descriptorDamage(){
            this.file('jb2a.impact_themed.ice_shard.blue')
            .scaleToObject(2.5)
            super.affectCommon()
                .file("jb2a.impact.ground_crack.frost.01.white")
                .belowTokens()
                .scaleToObject(3)
            return this;
        }     
        descriptorHealing(){
            this.file("jb2a.healing_generic.burst.bluewhite")
                .scaleToObject(4)
                .delay(1100)
            return this
        }
        descriptorInsubstantial(){
            this.descriptorAura();
            return this
        }
        descriptorProtection(){
            this.descriptorAura()
            .file("jb2a.shield_themed.above.ice.01.blue")
            .playbackRate(1)
            .scaleToObject()
            .scale(1.8)
            .fadeIn(500)
            .rotateIn(180, 600, {ease: "easeOutCubic"})
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
            .filter("Glow", {distance: 5})
            .persist()
            .delay(1000)
        }

        descriptorTeleport(position){
            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: this.saturate })
            .animateProperty("sprite", "width", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens()

            .pause(1000)
            
            super.affectCommon()
            .file("jb2a.misty_step.02.yellow")
            .filter("ColorMatrix", { hue: this.hue })
            .opacity(0.8)
            .scaleToObject(1.5)
            return this
        }

    }
    class ImpactEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class InvincibleEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class InsectEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        cast({caster, affected , duration = 1}={}){ 
            super.castCommon({caster:caster, affected:affected})
                .file("jaamod.assets.flies")
                .scaleToObject( .6 )
                .repeats(30)
                .filter("ColorMatrix", {hue: 520,brightness: 0,contrast:0, saturate:0} )  
                .playSound("modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Attack_01.ogg")
                .pause(duration)
            
            return this
        } 


        burst({affected,persist=true}={})
        {
            super.burstCommon({affected:affected})
            

            const templateWidth = this.affected.width;
            const templateHeight = this.affected.height;
            const numInstances =12; // Adjust to control the spread and density

            for (let i = 0; i < numInstances; i++) {
                this.effect()
                    .atLocation(this.affected)
                    .file("jaamod.spells_effects.swarm_spider")
                        .filter("ColorMatrix", 
                            {hue: 500,       
                            saturate: -1,  
                            brightness: .1, 
                            contrast: 1  
                        })
                    .scale(.65) 
                    .spriteOffset({
                        x: (Math.random() - 0.5) * templateWidth , 
                        y: (Math.random() - 0.5) * templateHeight 
                    }) 
                    .randomRotation() 
                    .persist(persist)
            }
        
            this.playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Continuing_Loop.ogg')
            return this
        }
        line({affected}={}) {
            super.lineCommon({affected:affected})

            const templateWidth = this.affected.width;
            const templateHeight = this.affected.height;
            const numInstances = 12; // Adjust to control the density along the line
        
            // Calculate the start and end points of the ray
            const { x: startX, y: startY } = this.affected.ray.A;
            const { x: endX, y: endY } = this.affected.ray.B;
        
            // Determine step increments
            const stepX = (endX - startX) / numInstances;
            const stepY = (endY - startY) / numInstances;
        
            for (let i = 0; i < numInstances; i++) {
                const posX = startX + stepX * i;
                const posY = startY + stepY * i;
        
                this.effect()
                    .atLocation({ x: posX, y: posY })
                    .file("jaamod.spells_effects.swarm_spider")
                    .filter("ColorMatrix", {
                        hue: 500,
                        saturate: -1,
                        brightness: 0.1,
                        
                        contrast: 1
                    })
                    .scale(0.65)
                    .randomRotation()
                    .persist();
            }

    // Play sounds sequentially
    this.playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
        .pause(1000)
        .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Continuing_Loop.ogg');

    return this;
    }
        cone({affected} = {}) {
            super.coneCommon({affected:affected})

            const { x: startX, y: startY } = this.affected.ray.A; // Starting point of the cone
            const { x: endX, y: endY } = this.affected.ray.B; // Endpoint of the cone
            const templateWidth = Math.hypot(endX - startX, endY - startY); // Calculate distance
            const templateAngle = this.affected.document.direction; // Direction angle of the cone
            const coneSpread = this.affected.document.angle; // Cone's angle of spread
            const numSpokes = 8; // Number of lines radiating within the cone
            const pointsPerSpoke = 4; // Number of points along each spoke
        
            // Angle increment between each spoke within the cone
            const angleStep = coneSpread / (numSpokes - 1);
        
            for (let spoke = 0; spoke < numSpokes; spoke++) {
                // Calculate the angle for this spoke within the cone
                const angle = templateAngle - coneSpread / 2 + spoke * angleStep;
                const rad = angle * (Math.PI / 180); // Convert to radians
        
                // Place points along each spoke
                for (let i = 1; i <= pointsPerSpoke; i++) {
                    const distance = (i / pointsPerSpoke) * templateWidth;
                    const posX = startX + distance * Math.cos(rad);
                    const posY = startY + distance * Math.sin(rad);
        
                    this.effect()
                        .atLocation({ x: posX, y: posY })
                        .file("jaamod.spells_effects.swarm_spider")
                        .filter("ColorMatrix", {
                            hue: 50,          // Adjust hue to desired value
                            saturate: -1,
                            brightness: 0.1,
                            contrast: 1
                        })
                        .scale(0.65)
                        .randomRotation()
                        .persist();
                }
            }
        
            // Play sounds sequentially
            this.playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
                .pause(1000)
                .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Continuing_Loop.ogg');
        
            return this;
        }


        meleeCast({caster, affected, repeats=1}={} ){
            super.meleeCastCommon({caster:caster, affected:affected}) 
                .file("jb2a.melee_generic.piercing.one_handed")
                .spriteOffset({x:-0.7* this.caster.document.width},{gridUnits:true})  
                .scale(.3)
                .randomizeMirrorY()
                .repeats (repeats,600)
                .playSound([
                    "modules/mm3e-animations/sounds/action/powers/Quills3.ogg",
                    "modules/mm3e-animations/sounds/action/powers/Quills2b.ogg",
                    "modules/mm3e-animations/sounds/action/powers/QuillsRipper.ogg"
                ], {repeats:repeats/4, duration:500})
                .lungeTowardTarget({ distance : .5, duration:100, repeats:repeats})  
            return this
        }
        
        project({caster, target }={}){ 
            super.projectCommon({caster:caster,target:target})
            this.file('jaamod.misc.bat_swarm')
            .scale({ x: 1, y: 0.1 })
            return this;
        }

        affectAffliction({affected}={})
        {
            super.affectCommon({affected:affected})
                this.file("jaamod.spells_effects.swarm_spider")
                .filter("ColorMatrix",  {hue: 500, saturate: -1, brightness: .1,contrast: 1  })
                .scaleToObject(1.4)
                .persist()
            .affectCommon()
                .file("jaamod.assets.flies")
                .scaleToObject( 1 )
                .repeats(30,100)
                .filter("ColorMatrix",  {hue: 500, saturate: -1, brightness: .1,contrast: 1  })
                .persist()
                .playSound("moduecles/mm3e-animations/sounds/action/powers/Swarm2_loop.ogg")
                .scale(.8) 
                .persist( true)
            .zIndex(10)
            .pause(800)

            .resistAndStruggle(this.affected)
            .pause(900
                    
                    )
            .resistAndStruggle(this.affected)
            return this;
        }

        affectAura({affected, duration=1, persist=false, scaleToObject = 1, spriteOffest={x:0, y:0}}={}){
            super.affectCommon({affected:affected})
                .file("jaamod.spells_effects.swarm_spider")
                .scaleToObject( scaleToObject )
                .repeats(1, 100)
                .filter("ColorMatrix", 
                    {hue: 500,       
                    saturate: -1,  
                    brightness: .1, 
                    contrast: 1  
                }).persist(persist)
                .spriteOffset(spriteOffest)
            super.affectCommon()
                .file("jaamod.assets.flies")
                .scaleToObject( scaleToObject )
                .repeats(30,100)
                .filter("ColorMatrix", 
                    {hue: 500,       
                    saturate: -1,  
                    brightness: .1, 
                    contrast: 1  
            }).persist(persist)
            .spriteOffset(spriteOffest)
            this.affectCommon()
                .playSound("modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Attack_01.ogg")
                .pause(duration)
            return this;
        }

        affectConcealment({affected}={})
        {
            this.affectAura({affected:affected, persist:true})
                .pause(1000)
                super.affectConcealment({affected:this.affected})
            return this;
        }
        
        affectDamage({affected = this.affected, repeats=1}={} ){ 
            this.affectCommon({affected: affected})
                .file("jaamod.sequencer_fx_master.contagion")      
                .scale(.2)
                .atLocation(affected)                
                .spriteOffset({ x: -15, y: 0 }) 
                .filter("ColorMatrix", {
                    hue: 50,       // Adjust the hue to shift the color towards brown
                    saturate: -1,  // Reduce saturation to bring it closer to brown
                    brightness: .5, // Keep the brightness neutral
                    contrast: 1    // Default contrast
                }) 
                .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
            .affectCommon()
                .file("jaamod.assets.flies")      
                .scale(.2)  
                .atLocation(affected)                 
                .rotate(10)
                .mirroredY()
                .repeats(8,200)
            .affectCommon()
                .pause(1000)
                .recoilAwayFromSelected({affected:affected, distance : .2, duration:100, repeats:repeats})
            
            return this;
        }

        affectHealing({affected = this.affected|| this.firstSelected}={}){
            this.affectAura({affected:affected, persist:false})
                .pause(1000)
                super.affectHealing({affected:affected})
            return this;
        }

        affectIllusion({affected = this.affected}={})
        {
            this.affectAura({affected:affected, persist:true})
                .pause(1000)
                super.affectIllusion({affected:affected})

            return this;
        }

        affectSenses({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            this.file('animated-spell-effects-cartoon.electricity.wave')
            .spriteOffset({x:25, y:0})
            .scaleToObject(.45)
            .rotate(90)
            .belowTokens()
            .filter("ColorMatrix", {hue: 0, contrast: 0, saturate: 0})
            .tint('0x000000')
            .playSound('modules/mm3e-animations/sounds/action/powers/CrabEye_loop.ogg')
            return this;
        }

        affectMindControl({affected = this.affected}={}){
            this.affectAura({affected, scaleToObject:.6 , spriteOffest:{x:0, y:-30} , persist:true})
            .pause(2000)
            super.affectMindControl(affected)
            return this
        }

        affectWeaken({affected = this.affected}={}){
            this.affectAura({affected,  persist:true})
                .pause(1000)
                super.affectWeaken(affected)
            return this
        }
    }  
    class PlantEffectSection  extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
            return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
            
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class PoisonEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
            return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
            
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }

    class PsychicEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
            return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
            
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class KineticEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    
    class LightningEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        castDamage({affected,caster}={}) {
            return super.castCommon({affected:affected, caster:caster, rotation:false})
                .file("animated-spell-effects-cartoon.fire.03") // Fire casting animation
                .spriteOffset({ x: 15, y: 0 })
                .scale(0.3)
                .waitUntilFinished(-1000)
            .file("modules/animated-spell-effects-cartoon/assets/spell-effects/cartoon/fire/fire_55_800x800.webm") // Fireball projectile
                .scale(0.08)
                .zeroSpriteRotation(true)
                .fadeIn(100)
                .fadeOut(50)
        }
        cast({caster, affected , duration = 1}={}){ //bigger
            super.castCommon({caster:caster, affected:affected})
            .file("jb2a.static_electricity.01.blue")
                .playbackRate(1)
                .opacity(0.9)
                .scaleToObject(1.5)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
                .duration(5000)
            super.cast()
                .file("jb2a.static_electricity.02.blue")
                .opacity(0.9)
                .scaleToObject(1.5)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
                .duration(5000)
            super.cast()
                .file("jb2a.static_electricity.02.blue")
                .fadeIn(350)
                .fadeOut(350)
                .opacity(0.9)
                .scaleToObject(3)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
                .randomRotation()
                .belowTokens()
                .duration(1800)

            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Damage/Lightning/electric-continuous-1.mp3")
            .volume(0)
            .startTime(15000)
            .duration(5000)
            .fadeOutAudio(800)
                
            return this;
        }
        cast2({caster, affected , duration = 1}={}){ //simpler
            super.castCommon({caster:caster, affected:affected})
            .file("jb2a.static_electricity.02.blue")
            .opacity(0.9)
            .scaleToObject(1.5)
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .duration(6000)
            return this;
        }

        castRange({caster, affected , duration = 1}={}){
            super.cast({caster:caster, affected:affected})
            .file("animated-spell-effects-cartoon.fire.19")
            .playbackRate(1)
            .scale(0.3)
            .waitUntilFinished(-800)
                
            super.cast()
            .file("jb2a.cast_generic.fire.side01.orange.0")
            .playbackRate(1)
            .scaleToObject(1.5)
            .rotateTowards(this.affected)
            .anchor({ x: 0.4, y: 0.5 })
            .waitUntilFinished(-100)
            .duration(600)
            return this;
        }
        meleeCast({caster, affected, repeats=1}={} ){
            super.meleeCastCommon({caster:caster, affected:affected}) 
            let target = Array.from(game.user.targets)[0];
            let targetCenter = {
                x: this.affected.x+canvas.grid.size*this.affected.document.width/2,
                y: this.affected.y+canvas.grid.size*this.affected.document.width/2,
                };
                
                const tokenCenter = {
                x: this.caster.x+canvas.grid.size*this.caster.document.width/2,
                y: this.caster.y+canvas.grid.size*this.caster.document.width/2,
                };
                
                const middleposition = {
                    x: (targetCenter.x - tokenCenter.x)* 0.25,
                    y: (targetCenter.y - tokenCenter.y)* 0.25,
                };


    this.effect()
    .file(`jb2a.static_electricity.02.blue`)
    .atLocation(this.caster)
    .opacity(0.9)
    .scaleToObject(1.5)
    .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
    .duration(5000)


    .sound()
    .file("modules/dnd5e-animations/assets/sounds/Damage/Lightning/electric-shock-1.mp3")
    .fadeInAudio(500)
    .fadeOutAudio(500) 

.wait(500)

super.meleeCastCommon()
    .file("blfx.spell.melee.arm1.hand1")
    .atLocation(this.caster)
    .spriteAnchor({ x: 0.9, y: 0.5 })
    .filter("ColorMatrix", { hue: 0, brightness: 1, contrast: 0, saturate: 0 })
    .scaleToObject(2)
    .delay(100)
    .rotateTowards(this.affected)
    .playbackRate(1)
    .fadeOut(100)
    .zIndex(2)
    .opacity(0)

    .wait(50)

super.meleeCastCommon()
    .file("jb2a.unarmed_strike.no_hit.01.blue")
    .atLocation(this.caster, { edge: "outer" })
    .stretchTo(this.affected)
    .filter("ColorMatrix", { hue: 0, brightness: 1, contrast: 0, saturate: -0.8 })
    .tint("#e6e6e6")
    .delay(100)
    .playbackRate(1.25)
    .fadeOut(100)
    .zIndex(2)

    
.wait(750)

.canvasPan()
    .delay(250)
    .shake({duration: 250, strength: 2, rotation: false })

super.meleeCastCommon()
    .file("animated-spell-effects-cartoon.cantrips.shocking_grasp.blue")
    .atLocation(this.caster)
    .rotateTowards(this.affected)
    .scale(0.5)
    .spriteAnchor({ x: 0.8, y: 0.5 })
    .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
    .aboveLighting()

super.meleeCastCommon()
    .file("jb2a.swirling_leaves.outburst.01.pink")
    .scaleIn(0, 500, {ease: "easeOutCubic"}) 
    .filter("ColorMatrix", { saturate: 1, hue: -105 })
    .scaleToObject(0.75)
    .fadeOut(2000)
    .atLocation(this.caster)
    .zIndex(1)

super.meleeCastCommon()
    .file(`jb2a.static_electricity.02.blue`)
    .atLocation(this.affected)
    .scaleToObject(1.5)
    .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})    

.animation()
    .on(this.caster)
    .opacity(0)            

super.meleeCastCommon()
    .from(this.caster)
    .atLocation(this.caster)
    .mirrorX(this.caster.document.mirrorX)
    .animateProperty("sprite", "position.x", { from: 0, to: middleposition.x, duration: 100, ease:"easeOutExpo"})
    .animateProperty("sprite", "position.y", { from: 0, to: middleposition.y, duration: 100, ease:"easeOutExpo"})
    .animateProperty("sprite", "position.x", { from: 0, to: -middleposition.x, duration: 350, ease:"easeInOutQuad", fromEnd:true})
    .animateProperty("sprite", "position.y", { from: 0, to: -middleposition.y, duration: 350, ease:"easeInOutQuad", fromEnd:true})
    .scaleToObject(1, {considerTokenScale: true})
    .duration(600)

.animation()
    .on(this.caster)
    .opacity(1)
    .delay(600)

super.meleeCastCommon()
    .file("animated-spell-effects-cartoon.water.85")
    .scaleIn(0, 100, {ease: "easeOutCubic"}) 
    .scaleToObject(2.8)
    .atLocation(this.affected)
    .filter("ColorMatrix", {hue: 5, brightness: 1, contrast: 0, saturate: -0.8})
    .randomRotation()

super.meleeCastCommon()
    .file("animated-spell-effects-cartoon.air.spiral.gray")
    .scaleIn(0, 100, {ease: "easeOutCubic"}) 
    .scaleToObject(2.8)
    .atLocation(this.affected)
    .filter("ColorMatrix", {hue: 5, brightness: 1, contrast: 0, saturate: -0.8})
    .randomRotation()

    .sound()
    .file("modules/dnd5e-animations/assets/sounds/Damage/Lightning/lightning-impact-8.mp3")
    .fadeInAudio(500)
    .fadeOutAudio(500)

    .sound()
    .file("modules/lancer-weapon-fx/soundfx/Axe_swing.ogg")
    .fadeInAudio(500)
    .fadeOutAudio(500)

super.meleeCastCommon()
    .file("jb2a.impact.ground_crack.blue.01")
    .scaleToObject(3)
    .atLocation(target)
    .randomRotation()
    .belowTokens()

super.meleeCastCommon()
.delay(200)
.file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
.scaleIn(0, 100, {ease: "easeOutCubic"}) 
.scaleToObject(1.75)
.opacity(0.5)
.atLocation(target)
.belowTokens()
    
    super.meleeCastCommon()
.delay(200)
.file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
.scaleIn(0, 100, {ease: "easeOutCubic"}) 
.scaleToObject(2.5)
.opacity(0.5)
.atLocation(target)
.belowTokens()
    
    super.meleeCastCommon()
    .delay(200)
    .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
    .scaleIn(0, 100, {ease: "easeOutCubic"}) 
    .scaleToObject(2.5)
    .opacity(0.5)
    .atLocation(target)
    .belowTokens()
    
    super.meleeCastCommon()
    .from(target)
    .atLocation(target)
    .fadeIn(200)
    .fadeOut(500)
    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
    .scaleToObject(target.document.texture.scaleX)
    .duration(3000)
    .opacity(0.25)
            return this
        }
        project({caster, target }={}){ 
            super.projectCommon({caster:caster,target:target})
                .file("jb2a.chain_lightning.primary.blue")
                .spriteOffset({ x: 20, y: 0 })
                .playbackRate(1)
                .scale(1)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
                .waitUntilFinished(-2000)
        return this;
        }

        projectRange({caster, target }={}){ 
            super.projectCommon({caster:caster,target:target})
                .file("jb2a.lightning_bolt.wide.blue")
                .spriteOffset({ x: 20, y: 0.5 })
                .playbackRate(1.5)
                .scale(1)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
        return this;
        }

        projectRay({caster, target }={}){ 
            const targets = Array.from(game.user.targets);
const origin = this.caster.center;

// Sort targets based on distance from the origin token
targets.sort((a, b) => canvas.grid.measureDistance(origin, a.center) - canvas.grid.measureDistance(origin, b.center));

            super.projectCommon({caster:caster,target:target})
            .atLocation(targets[index])
            .stretchTo(targets[index + 1])
            .file("jb2a.chain_lightning.secondary.blue")
            .delay((index + 1) * 600)
        return this;
        }
        affectDamage({affected = this.affected, repeats=1}={} ){ 
        this.affectCommon({affected: affected})
            .file(`jb2a.static_electricity.02.blue`)
            .scaleToObject(1.5)
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .duration(3000)
            
        this.affectCommon()
            .from(this.affected)
            .fadeIn(200)
            .fadeOut(500)
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .scaleToObject(this.affected.document.texture.scaleX)
            .duration(6000)
            .opacity(0.25)

            .canvasPan()
            .shake({duration: 800, strength: 1, rotation: false })
        return this
    }
        projectChain({ caster = this.firstSelected, targets = Array.from(game.user.targets), } = {}) {
        if (targets.length === 0) return this;

        // Sort targets by distance from the caster
        targets.sort((a, b) =>
            canvas.grid.measureDistance(this.getTokenCenter(caster), this.getTokenCenter(a)) -
            canvas.grid.measureDistance(this.getTokenCenter(caster), this.getTokenCenter(b))
        );

        // Start chain lightning from caster to the first target
        this.mm3eEffect()
            .atLocation(caster)
            .stretchTo(targets[0])
            .file("jb2a.chain_lightning.primary.blue")

        // Chain between each target
        for (let index = 0; index < targets.length - 1; index++) {
            this.mm3eEffect()
                .atLocation(targets[index])
                .stretchTo(targets[index + 1])
                .file("jb2a.chain_lightning.secondary.blue")
                .delay((index + 1) * 600)


        }


        return this;
    }
        projectChainHealing({ caster = this.firstSelected, targets = Array.from(game.user.targets), } = {}) {
        if (targets.length === 0) return this;

        // Sort targets by distance from the caster
        targets.sort((a, b) =>
            canvas.grid.measureDistance(this.getTokenCenter(caster), this.getTokenCenter(a)) -
            canvas.grid.measureDistance(this.getTokenCenter(caster), this.getTokenCenter(b))
        );

        // Start chain lightning from caster to the first target
        this.mm3eEffect()
            .atLocation(caster)
            .stretchTo(targets[0])
            .file("jb2a.chain_lightning.primary.blue")

        // Chain between each target
        for (let index = 0; index < targets.length - 1; index++) {
            this.mm3eEffect()
                .atLocation(targets[index])
                .stretchTo(targets[index + 1])
                .file("jb2a.chain_lightning.secondary.blue")
                .delay((index + 1) * 600)

            this.mm3eEffect()
                .atLocation(targets[index])
                .file("jb2a.healing_generic.400px.blue")
                .filter("ColorMatrix", { hue: -10, contrast: 0.5, saturate: 0.1, brightness: 1 })
                .delay((index + 1) * 600)

        }

        // Healing effect for the last target
        this.mm3eEffect()
            .atLocation(targets[targets.length - 1])
            .file("jb2a.healing_generic.400px.blue")
            .filter("ColorMatrix", { hue: -10, contrast: 0.5, saturate: 0.1, brightness: 1 })
            .delay(targets.length * 600)


        return this;
    }
        
    affectHealing({affected = this.affected, repeats=1}={} ){ 
        this.affectCommon({affected: affected})
                .file("jb2a.healing_generic.400px.blue")
                .playbackRate(1)
                .scale(1)
                .fadeIn(500)
                .scaleOut(0.5, 500, { ease: "easeInOutBounce", delay: 0 })
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1, brightness: 1})

        this.affectCommon()
                .file(`jb2a.static_electricity.02.blue`)
                .scaleToObject(1.5)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})

            this.affectCommon()
            .file("jb2a.healing_generic.400px.blue")
                .playbackRate(1)
                .scale(2)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1, brightness: 1})
                .opacity(0)
                
                .playSound("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-long-4.mp3")
        return this;
    }
        affectHealing2({affected = this.affected, repeats=1}={} ){ 
        this.affectCommon({affected: affected})
                .file("jb2a.healing_generic.400px.blue")
                .playbackRate(1)
                .scale(1)
                .fadeIn(500)
                .scaleOut(0.5, 500, { ease: "easeInOutBounce", delay: 0 })
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1, brightness: 1})

        this.affectCommon()
                .file(`jb2a.static_electricity.02.blue`)
                .scaleToObject(1.5)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})

            this.affectCommon()
            .file("jb2a.healing_generic.400px.blue")
                .playbackRate(1)
                .scale(2)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1, brightness: 1})
                .opacity(0)
                
                .playSound("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-long-4.mp3")
            return this;
        }
    affectAffliction({affected}={}){
        super.affectCommon({affected:affected})
            .file(`jb2a.static_electricity.02.blue`)
            .scaleToObject(1.5)
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .persist()
        return this;
    }
    burst({affected,persist=true}={})
    {
        super.burstCommon({affected:affected})
            .file(`jb2a.impact.011.blue`)
            .scaleToObject(1.5)
            
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Damage/Lightning/lightning-impact-5.mp3")
            
        super.burstCommon()
            .file(`jb2a.impact.012.blue`)
            .scaleToObject(1.5)
            .randomRotation()
            
        super.burstCommon()
            .file(`jb2a.impact.012.blue`)
            .scaleToObject(1.5)
            .randomRotation()

        super.burstCommon()
            .file("jb2a.static_electricity.03.blue")
            .fadeIn(350)
            .fadeOut(350)
            .scaleToObject(1.1)
            .filter("ColorMatrix", { hue: -10, contrast: 0.5, saturate: 0.1, brightness: 1 })
            .randomRotation()
            .duration(3500)
            
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Damage/Explosion/explosion-echo-5.mp3")
                    return this
    }

    burstheal({affected,persist=true}={})
    {
super.burstCommon({affected:affected})
            .file(`jb2a.impact.011.blue`)
            .scaleToObject(1.5)
            
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Damage/Lightning/lightning-impact-5.mp3")
            
        super.burstCommon()
            .file(`jb2a.impact.012.blue`)
            .scaleToObject(1.5)
            .randomRotation()
            
        super.burstCommon()
            .file(`jb2a.impact.012.blue`)
            .scaleToObject(1.5)
            .randomRotation()

        super.burstCommon()
            .file(`jb2a.healing_generic.400px.blue`)
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1, brightness: 1})
            .scaleToObject(1.5)

        super.burstCommon()
            .file("jb2a.static_electricity.03.blue")
            .fadeIn(350)
            .fadeOut(350)
            .scaleToObject(1.1)
            .filter("ColorMatrix", { hue: -10, contrast: 0.5, saturate: 0.1, brightness: 1 })
            .randomRotation()
            .duration(3500)
            
            .sound()
            .file("modules/dnd5e-animations/assets/sounds/Damage/Explosion/explosion-echo-5.mp3")
        return this
    } 
    cone({affected} = {}) {
        const coneStart = { x: this.affected.data.x, y: this.affected.data.y };
        const template = canvas.templates.placeables.at(-1).document;
            
        super.coneCommon({affected:affected})
        .file("jb2a.particles.outward.blue.01.04")
        .atLocation(coneStart)
        .fadeIn(500)
        .fadeOut(500)
        .anchor({x:0.5})
        .scaleToObject(2)
        .duration(5000)
        .rotateTowards(template, {cacheLocation: true})
        .loopProperty("sprite", "rotation", { from: -360, to: 360, duration: 3000})
        .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
        .zIndex(1)

        super.coneCommon()
        .file("jb2a.particles.outward.blue.01.04")
        .atLocation(coneStart)
        .fadeIn(500)
        .fadeOut(500)
        .anchor({x:0.5})
        .scaleToObject(2)
        .duration(5000)
        .rotateTowards(template, {cacheLocation: true})
        .loopProperty("sprite", "rotation", { from: 360, to: -360, duration: 3000})
        .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
        .zIndex(1)

            
        super.coneCommon()
        .file(`jb2a.static_electricity.02.blue`)
        .atLocation(coneStart)
        .scaleToObject(1.5)
        .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
        .duration(3000)

        super.coneCommon()
        .canvasPan()
        .shake({duration: 4000, strength: 5, rotation: false })

        super.coneCommon()
        .file("jb2a.impact.011.blue")
        .atLocation(coneStart)
        .fadeOut(3000)
        .scaleToObject(8)
        .zIndex(3)
        

        super.coneCommon()
        .file("jb2a.impact.ground_crack.02.blue")
        .atLocation(coneStart)
        .belowTokens()
        .filter("ColorMatrix", {saturate: 2})
        .fadeOut(1000)
        .scaleToObject(4)
        .zIndex(2)
        
        super.coneCommon()
        .file("jb2a.ground_cracks.blue.02")
        .atLocation(coneStart)
        .belowTokens()
        .filter("ColorMatrix", {saturate: 1})
        .duration(6000)
        .fadeOut(1000)
        .scaleToObject(4)
        .delay(500)
        .zIndex(1)
        
        super.coneCommon()
        .file("jb2a.burrow.out.01.still_frame.0")
        .atLocation(coneStart)
        .duration(5000)
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()
        .scaleToObject(6)
        .filter("ColorMatrix", { saturate: 1 })
        .zIndex(1)  
        
        
        super.coneCommon()
        .file("jb2a.template_cone_5e.lightning.01.complete.bluepurple")
        .atLocation(coneStart)
        .stretchTo(template)
        .aboveLighting()
        .playbackRate(1.7)
        .fadeIn(100)
        .fadeOut(800)
            return this;
        }
        descriptorCast(){
                return this
        }

        descriptorCastBurrow(position){
            this.castCommon({affected:affected, caster:caster})
            .file("jb2a.static_electricity.03.blue")
            .fadeIn(350)
            .fadeOut(350)
            .scaleToObject(3)
            .filter("ColorMatrix", { hue: -10, contrast: 0.5, saturate: 0.1, brightness: 1 })
            .randomRotation()
            .belowTokens()
            .duration(1800)
            
            super.affectCommon()
                .file(`jb2a.static_electricity.02.blue`)
                .opacity(0.9)
                .scaleToObject(1.5)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .waitUntilFinished(-100)
            
            super.affectCommon()
            .file("jb2a.impact.earth.01.browngreen.0")
            .scaleToObject(4)
            .opacity(0.8)
            .filter("ColorMatrix", {hue:70, contrast: 0.5, saturate: 0.5,brightness: 1,})
            
            .pause(500)
            
            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .duration(5000)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens()
            .scaleToObject(6)
            .filter("ColorMatrix", { saturate: 1 })
            .zIndex(1)
            
            super.affectCommon()
            .file("jb2a.lightning_bolt.wide.blue")
            .opacity(1)
            .scale(this.caster.w / canvas.grid.size)
            .stretchTo(position)
            .zIndex(1)
            return this
        }
        descriptorCastLeap(position){}
        descriptorCastTeleport(position){}
        descriptorCastSpeed(position){}
        descriptorCastFlight(position){}
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.file("jb2a.chain_lightning.primary.blue")
            .delay(1200)
        }
        descriptorProjectToCone() {
            return this.file("jb2a.chain_lightning.primary.blue")
            .delay(1200)
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine({affected} = {}) {
            let template = canvas.templates.placeables.at(-1).document;
            const lineTemplate = canvas.templates.placeables.at(-1).document;

            const start = { x: lineTemplate.x, y: lineTemplate.y };

        this.file("jb2a.particles.outward.blue.01.04")
        .atLocation(start)
        .fadeIn(500)
        .fadeOut(500)
        .anchor({x:0.5})
        .scaleToObject(2)
        .duration(5000)
        .rotateTowards(template, {cacheLocation: true})
        .loopProperty("sprite", "rotation", { from: -360, to: 360, duration: 3000})
        .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
        .zIndex(1)


        super.lineCommon()
        .file("jb2a.particles.outward.blue.01.04")
        .atLocation(start)
        .fadeIn(500)
        .fadeOut(500)
        .anchor({x:0.5})
        .scaleToObject(2)
        .duration(5000)
        .rotateTowards(template, {cacheLocation: true})
        .loopProperty("sprite", "rotation", { from: 360, to: -360, duration: 3000})
        .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
        .zIndex(1)

            
        super.lineCommon()
        .file(`jb2a.static_electricity.02.blue`)
        .atLocation(start)
        .scaleToObject(1.5)
        .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
        .duration(3000)

        .canvasPan()
        .shake({duration: 4000, strength: 5, rotation: false })

        super.lineCommon()
        .file("jb2a.impact.011.blue")
        .atLocation(start)
        .fadeOut(3000)
        .scaleToObject(8)
        .zIndex(3)
        

        super.lineCommon()
        .file("jb2a.impact.ground_crack.02.blue")
        .atLocation(start)
        .belowTokens()
        .filter("ColorMatrix", {saturate: 2})
        .fadeOut(1000)
        .scaleToObject(4)
        .zIndex(2)
        
        super.lineCommon()
        .file("jb2a.ground_cracks.blue.02")
        .atLocation(start)
        .belowTokens()
        .filter("ColorMatrix", {saturate: 1})
        .duration(6000)
        .fadeOut(1000)
        .scaleToObject(4)
        .delay(500)
        .zIndex(1)
        
        super.lineCommon()
        .file("jb2a.burrow.out.01.still_frame.0")
        .atLocation(start)
        .duration(5000)
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()
        .scaleToObject(6)
        .filter("ColorMatrix", { saturate: 1 })
        .zIndex(1)  
        
        
        super.lineCommon()
        .file("jb2a.breath_weapons.lightning.line.blue")
        .atLocation(start)
        .stretchTo(template)
        .aboveLighting()
        .fadeIn(50)
        .fadeOut(50)
        .playbackRate(1.2)
            return this
        }
        descriptorCone() {
            
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }

        descriptorBurrow(){
            this.file("jb2a.cast_generic.02.blue.0")
                .atLocation(this.affected)
                .scaleToObject(2.25)
                .animateProperty("sprite", "width", { from: this.affected.document.width * 2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits: true, delay: 500 })
                .animateProperty("sprite", "height", { from: this.affected.document.width * 2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits: true, delay: 500 })
                .animateProperty("sprite", "width", { from: 0, to: this.affected.document.width * 2.25, duration: 500, ease: "easeOutCubic", gridUnits: true, delay: 2500 })
                .animateProperty("sprite", "height", { from: 0, to: this.affected.document.width * 2.25, duration: 500, ease: "easeOutCubic", gridUnits: true, delay: 2500 })
                .playbackRate(0.8)
                .belowTokens()
                .pause(1000)
            super.affectCommon()
                .file("jb2a.impact.earth.01.browngreen.0")
                .atLocation(this.affected)
                .scaleToObject(6)
                .opacity(0.8)
                .filter("ColorMatrix", {hue:70, contrast: 0.5, saturate: 0.5,brightness: 1,})
            super.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .atLocation(this.affected)
                .opacity(0.8)
                .belowTokens()
                .scaleToObject(8)
                .filter("ColorMatrix", {hue:70, contrast: 0.5, saturate: 0.5,brightness: 1,})
                .zIndex(1)
            .animation()
            .delay(1400)
            .on(this.affected)
            .fadeIn(200)

            super.affectCommon()
                .file("animated-spell-effects-cartoon.electricity.18")
                .filter("ColorMatrix", { brightness: 1, contrast: 1 })
                .fadeOut(3000)
                .scaleToObject(6)
                .zIndex(3)
                .waitUntilFinished(-2000)
            super.affectCommon()
                .file("jb2a.impact.ground_crack.02.blue")
                .belowTokens()
                .filter("ColorMatrix", { saturate: 2 })
                .fadeOut(1000)
                .scaleToObject(4)
                .zIndex(2)
            return this
        }
        descriptorLeap(){}
        descriptorTeleport(){}
        descriptorSpeed(){}
        descriptorFlight(){}
        descriptorHealing(){
            
            return this
        }

    /*
    
    descriptorAura(){
        return this
    }

    descriptorConcealment()
    {
        return this;
    }

    descriptorIllusion(){
        return this
    }
    descriptorInsubstantial(){
        return this
    }

    descriptorMindControl(){
        return this
    }

    descriptorMindControl(){
        return this
    }

    descriptorNullify(){
        return this
    }

    descriptorProtection(){
        return this
    }

    descriptorTransform(){
        return this
    }

    descriptorWeaken(){
        return this
    }*/

    }
    class MagnetismEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class MagicEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
                
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
            
            return this
        }

        /*
        
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }
    class RadiationEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        /* castCone({affected, caster}={}){
            return this
        }*/


        startRadiation(){
            this.castCommon({rotation:false})
            .file("jb2a.particles.inward.blue.01.02")
            .playbackRate(0.5)
            .scale(1)
            .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
            .duration(3000)
            .fadeIn(500)
            .fadeOut(800)
            
            super.castCommon()
            .file(`jb2a.token_border.circle.static.blue.003`)
            .opacity(0.9)
            .fadeIn(1000, {ease: "easeInExpo"})
            .fadeOut(2500, {ease: "easeInExpo"})
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000})
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .scaleIn(0, 3000, {ease: "easeOutBack"})
            .scaleOut(0, 3000, {ease: "easeInBack"})
            .belowTokens()
            .tint("#5dd20f")
            .duration(8000)
            return this
        }
        descriptorCast(){
            this.startRadiation()
            super.castCommon()
                .file("jb2a.cast_generic.02.green")
                .playbackRate(.5)
                .scale(1)
                .delay(500)
                .fadeIn(500)
                .fadeOut(800)
                .belowTokens() 
            .pause(2000)
            return this    
        }

        castBurst({affected, caster}){
            this.effect()
                .file(canvas.scene.background.src)
                .filter("ColorMatrix", { brightness: 0.8 })
                .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
                .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
                .spriteOffset({ x: 0 }, { gridUnits: true })
                .opacity((this.caster.document.width * 0.05) + 0.5)
                .duration(10000)
                .fadeIn(500)
                .fadeOut(1000)
                .belowTokens()
                .tint("#5dd20f")
            super.castCommon({affected:affected, caster:caster})
                .descriptorCast()
                .file("jb2a.particle_burst.01.circle.bluepurple")
                .rotateTowards(this.affected)
                .spriteOffset({ x: -0.2 }, { gridUnits: true })
                .spriteScale({ x: 0.8, y: 1 })
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .rotate(0)
                .scaleToObject(1)
                .scaleIn(0, 1500, { ease: "easeOutCubic" })
                .animateProperty("sprite", "position.x", { from: -0.5, to: 0.05, duration: 1000, gridUnits: true, ease: "easeOutBack", delay: 0 })
                .tint("#e51e19")
                .zIndex(0)
                .pause(1200)
            return this
        }
        castBurrowing({affected, caster,position}={}){

            let hue = -0
            let saturate = 0
            let tint = "#144f08"
            this.castCommon({affected:affected, caster:caster})
            .file("jb2a.particles.inward.blue.01.02")
            .fadeIn(350)
            .fadeOut(350)
            .scaleToObject(3)
            .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
            .randomRotation()
            .belowTokens()
            .duration(1800)

            super.affectCommon()
            .file("jb2a.energy_strands.in.green.01")
            .fadeIn(250)
            .fadeOut(200)
            .scaleToObject(2)
            //.belowTokens()
            .waitUntilFinished(-100)

            super.affectCommon()
            .file("jb2a.impact.earth.01.browngreen.0")
            .scaleToObject(4)
            .opacity(0.8)
            .tint("#0e7c1b")
            .filter("ColorMatrix", {saturate: 1})

            .pause(500)

            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .duration(5000)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens()
            .scaleToObject(6)
            .tint("#0e7c1b")
            .filter("ColorMatrix", {saturate: 1})
            .zIndex(1)

            super.affectCommon()
            .file("jb2a.spell_projectile.earth.01.browngreen.05ft")
            .opacity(1)
            .scale(this.caster.w / canvas.grid.size)
            .stretchTo(position)
            .tint(tint)
            .zIndex(1)
            return this
        }
        descriptorMeleeCast(){
                this.descriptorCast()
            super.castCommon()
                .file("jb2a.unarmed_strike.magical.02.green")
                .stretchTo(this.affected)
                .filter("ColorMatrix", { hue: 0, brightness: 1, contrast: 0, saturate: 0 })
                .scale(3)
                .delay(100)
                .playbackRate(1.25)
                .fadeOut(100)
                .zIndex(2)
                .pause(750)
                .delay(250)
                
            //  .pause(1000)
            
            return this;
        }
        descriptorCastFlight(position){
        this.file("jb2a.particles.inward.blue.01.02")
            .playbackRate(0.5)
            .scale(1)
            .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
            .duration(3000)
            .fadeIn(500)
            .fadeOut(800)
        super.affectCommon()
            .file(`jb2a.this.caster_border.circle.static.blue.003`)
            .opacity(0.9)
            .size({ width: 2.5, height: 2.5 }, {gridUnits: true})
            .fadeIn(1000, {ease: "easeInExpo"})
            .fadeOut(2500, {ease: "easeInExpo"})
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000})
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .scaleIn(0, 3000, {ease: "easeOutBack"})
            .scaleOut(0, 3000, {ease: "easeInBack"})
            .belowTokens()
            .tint("#5dd20f")
            .duration(8000)
        super.affectCommon()
            .file("jb2a.cast_generic.02.green.0")
            .playbackRate(0.5)
            .scale(1)
            .delay(500)
            .fadeIn(500)
            .fadeOut(800)
            .belowTokens()
            .waitUntilFinished() 
        super.affectCommon()
            .file("animated-spell-effects-cartoon.air.explosion.green")
            .scaleToObject(3.5)
        .pause(500)
        this.name("flyRad")
                    .file("animated-spell-effects-cartoon.smoke.39")
                    .scaleToObject(2)
                    .rotate(90)
                    .opacity(1)
            .attachTo(this.affected, {bindAlpha: false})
                    .tint("#047111")
                    .loopProperty("sprite", "position.x", {  from:0 ,to:0.100, duration: 2500, pingPong: true, delay:500, ease: "easeInOutCubic", gridUnits:true})
                    .spriteOffset({x:-40, y: -30})
            .atLocation(this.affected)
                    .persist()     
            super.affectCommon()
                    .name("flyRad")
                .attachTo(this.affected, {bindAlpha: false})
                    .opacity(1)
                    .file("animated-spell-effects-cartoon.smoke.39")
                    .scaleToObject(2)
                    .loopProperty("sprite", "position.x", {  from:0 ,to:0.100, duration: 2500, pingPong: true, delay:500, ease: "easeInOutCubic", gridUnits:true})
                    .rotate(90)
                    .spriteOffset({x:-40, y: 30})
                    .atLocation(this.affected)
                    .persist()
                    .tint("#047111")
                    .mirrorY()               
            super.affectCommon()
                    .file("jb2a.extras.tmfx.border.circle.outpulse.01.normal")
                    .atLocation(this.affected)
                    .scaleToObject(2)
                    .opacity(0.15)
            return this;

        }
        
        descriptorCastSpeed(position){
            this.file("jb2a.particles.inward.blue.01.02")
                .fadeIn(350)
                .fadeOut(350)
                .scaleToObject(3)
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .randomRotation()
                .belowTokens()
                .duration(1800)
        
            super.castCommon()
                .file("jb2a.particles.inward.blue.01.02")
                .fadeIn(350)
                .fadeOut(350)
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .scaleToObject(3)
                .randomRotation()
                .belowTokens()
                .duration(1800)
            
            super.castCommon()
                .file("jb2a.energy_strands.in.green.01")
                .fadeIn(250)
                .fadeOut(200)
                .scaleToObject(2)
                //.belowTokens()
                .pause(2500)
            
            super.castCommon()
                .file("jb2a.impact.ground_crack.02.green")
                .belowTokens()
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 2})
                .fadeOut(1000)
                .scaleToObject(4)
                .zIndex(2)
            super.castCommon()
                .file("jb2a.ground_cracks.green.02")
                .belowTokens()
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 1})
                .duration(6000)
                .fadeOut(1000)
                .scaleToObject(4)
                .zIndex(1)
            super.castCommon()
                .file("animated-spell-effects-cartoon.air.explosion.green")
                .scaleToObject(3.5)
            
            super.castCommon()
                .file("jb2a.smoke.puff.side.02.white.0")
                .rotateTowards(position)
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
            super.castCommon()
                .file("jb2a.template_line_piercing.generic.01.orange.15ft")
                .filter("ColorMatrix", { hue: 15, saturate: -0.6, contrast: 2})
                .opacity(0.9)
                .playbackRate(0.5)
                .spriteOffset({x: -3.5}, {gridUnits: true})
                .stretchTo(position, {cacheLocation: true})
                .pause(200)
                .pause(50)
                .canvasPan()
                .shake({duration: 1500, strength: 1, rotation: false })
            super.castCommon()
            // .delay(200)
                .file("jb2a.template_line.ice.01.blue")
                .stretchTo(position)
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 2})
                .fadeOut(500)
                .playbackRate(1.3)       
                .belowTokens()    
            super.castCommon()
                .file("animated-spell-effects-cartoon.smoke.99")
                .filter("ColorMatrix", {brightness: 1, contrast: 1.5})
                .spriteOffset({ x: -2.5, y: -1 }, { gridUnits: true })
                .rotateTowards(this.caster)
                .rotate(90)
                .scaleToObject(5, {considerTokenScale: true})
            super.castCommon()
                .file("jb2a.impact.ground_crack.02.green")
                .belowTokens()
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 2})
                .fadeOut(1000)
                .scaleToObject(4)
                .zIndex(2)
            super.castCommon()
                .file("jb2a.ground_cracks.green.02")
                .belowTokens()
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 1})
                .duration(6000)
                .fadeOut(1000)
                .scaleToObject(4)
                .delay(500)
                .zIndex(1)
            super.castCommon()
                .file("jb2a.template_circle.symbol.out_flow.poison.dark_green")
                .playbackRate(0.4)
                .scale(0.5)
                .opacity(0.5)
                .belowTokens()
                .duration(6000)
                .fadeOut(300)
                .zIndex(1)
            return this
        }

        descriptorProject() {
            this.projectCommon({affected:this.affected,caster:this.caster})
            .file("jb2a.disintegrate.green")
                .size({ width: 500, height: 100 })
                .scale(1)
                .filter("ColorMatrix", {hue:10, contrast: 0, saturate: 0.5,brightness: 0.9,})
                .playbackRate(1)
                .scale(2)
                .zIndex(3)
                
            .playSound("modules/lancer-weapon-fx/soundfx/flamethrower_fire.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)
            .pause(500)
            return this

        }
        projectAcid({caster, affected}={}){
            this.projectCommon({affected:affected,caster:caster})
                .file("jb2a.breath_weapons.acid.line.green")
                .spriteScale(0.5)
                .aboveLighting()
                .fadeIn(50)
                .fadeOut(50)
                .filter("ColorMatrix", {hue:10, contrast: 0.2, saturate: 0.1,brightness: 0.9,})
                .pause(2000)
            return this
        }
        projectGreenPurple({caster, affected}={}){
            this.projectCommon({affected:affected,caster:caster})
            .file("jb2a.energy_beam.normal.dark_greenpurple.03")
                .playbackRate(0.8)
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
                .tint("#5dd20f")
                .scale(1)
                .delay(1000)
                .fadeIn(500)
                .fadeOut(800)
                .duration(9000)   
                .pause(2000)
            return this
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   
        descriptorBurst() {
            this.file("jb2a.cast_generic.02.green.0")
                .playbackRate(0.5)
                .scaleToObject(2)
                .delay(500)
                .fadeIn(500)
                .fadeOut(800)
                .belowTokens()
            
                .canvasPan()
                .shake({ duration: 4000, strength: 5, rotation: false })
                .delay(2500)
            
            
            super.burstCommon()
                .file("jb2a.smoke.puff.ring.01.dark_black.0")
                .delay(2000)
                .scaleToObject(2)
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .playbackRate(0.5)
                .zIndex(0.5)
            
            super.burstCommon()
                .file("jb2a.toll_the_dead.green.skull_smoke")
                .fadeIn(200)
                .fadeOut(1750)
                .delay(2200)
                .opacity(1)
                .scaleIn(0, 1867, { ease: "easeOutCirc" })
                .scaleToObject(3.2)
                .filter("Glow", { color: "#0d0d0c", distance: 2, outerStrength: 3, innerStrength: 3 })
                .zIndex(5)
                .aboveLighting()
            
            super.burstCommon()
                .name("Fallout")
                .file("jb2a.impact.ground_crack.green.01")
                .scaleToObject(1.5)
                .fadeOut(1000, { ease: "easeInCubic" })
                .endTime(1000)
                .delay(2500)
                .belowTokens()
                .persist()
                .noLoop()
                .zIndex(0)
            
            super.burstCommon()
                .name("Fallout")
                .file("jb2a.ground_cracks.green.01")
                .scaleToObject(1.5)
                .fadeOut(1000, { ease: "easeInCubic" })
                .delay(2500)
                .belowTokens()
                .persist()
                .zIndex(0)
            
            super.burstCommon()
                .name("Fallout")
            .file("jb2a.token.symbol.out_flow.poison.dark_green")
                .playbackRate(0.4)
                .scale(1.4)
                .delay(2000)
                .opacity(0.5)
                .belowTokens()
                .fadeIn(800)
                .fadeOut(1500)
                .persist()
                .zIndex(1)
            
            super.burstCommon()
                .name("Fallout")
                .file("jb2a.extras.tmfx.outflow.circle.01")
                .size(13, { gridUnits: true })
                .opacity(0.7)
                .scaleIn(0, 2500, { ease: "easeOutBack" })
                .scaleOut(0, 6500, { ease: "easeInSine" })
                .filter("ColorMatrix", { brightness: 0 })
                .rotate(90)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 20000 })
                .belowTokens()
                .delay(2000)
                .persist()
                .zIndex(-1)
            
            super.burstCommon()
                .file(canvas.scene.background.src)
                .filter("ColorMatrix", { brightness: 0.8 })
                .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
                .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
                .spriteOffset({ x: -0 }, { gridUnits: true })
            .opacity((this.caster.document.width*0.05)+0.5)
                .duration(10000)
                .fadeIn(500)
                .fadeOut(1000)
                .belowTokens()
                .tint("#5dd20f")
            return this;
        }
        burstAffectDamage({affected, caster}={}){
            super.burstCommon({affected:affected, caster:caster})
            .file("jb2a.cast_generic.02.green.0")
            .atLocation(this.affected)
                .playbackRate(0.5)
                .scaleToObject(2)
                .delay(500)
                .fadeIn(500)
                .fadeOut(800)
                .belowTokens()
                .canvasPan()
                .shake({ duration: 4000, strength: 25, rotation: false })
                .delay(2500)
                    .effect("modules/lancer-weapon-fx/sprites/shockwave.png")
                    .duration(7000)
                    .scale(0.2)
                    .scaleOut(8, 7000)
                    .fadeOut(7000)
                    .delay(3000)
                
            this.playSound("https://assets.forge-vtt.com/bazaar/modules/lancer-weapon-fx/assets/soundfx/pw_nuke.ogg")
                .delay(2000)
                .duration(8000)
                .fadeOutAudio(3000)
            
            super.burstCommon()
                .file("jb2a.smoke.puff.ring.01.dark_black.0")
            
                .delay(2000)
                .scaleToObject(2)
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .playbackRate(0.5)
                .zIndex(0.5)
            
            super.burstCommon()
                .file("animated-spell-effects-cartoon.fire.explosion.06")
            
                .scaleToObject(2)
                .scaleIn(0, 3000, { ease: "easeOutCubic" })
                .fadeOut(500, { ease: "easeInCubic" })
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 1,brightness: 1,})
                .tint("#5dd20f")
                .delay(1300)
                .playbackRate(1)
                .zIndex(2)
            
            super.burstCommon()
                .file("animated-spell-effects-cartoon.mix.fire earth explosion.05")
            
                .scaleToObject(3)
                .anchor({ x: 0.5, y: 0.4, gridUnits:true })
                .scaleIn(0, 1500, { ease: "easeOutCubic" })
                .scaleOut(0, 2500, { ease: "easeInBack" })
                .fadeOut(500, { ease: "easeInCubic" })
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 1,brightness: 1,})
                .tint("#5dd20f")
                .delay(1800)
                .zIndex(1)
            
            
            super.burstCommon()
                .file("jb2a.toll_the_dead.green.skull_smoke")
            
                .fadeIn(200)
                .fadeOut(1750)
                .delay(2200)
                .opacity(1)
                .scaleIn(0, 1867, { ease: "easeOutCirc" })
                .scaleToObject(3.2)
                .filter("Glow", { color: "#0d0d0c", distance: 2, outerStrength: 3, innerStrength: 3 })
                .zIndex(5)
                .aboveLighting()
            
            super.burstCommon()
                .name("Fallout")
                .file("jb2a.impact.ground_crack.green.01")
            
                .scaleToObject(1.5)
                .fadeOut(1000, { ease: "easeInCubic" })
                .endTime(1000)
                .delay(2500)
                .belowTokens()
                .persist()
                .noLoop()
                .zIndex(0)
            
            super.burstCommon()
                .name("Fallout")
                .file("jb2a.ground_cracks.green.01")
            
                .scaleToObject(1.5)
                .fadeOut(1000, { ease: "easeInCubic" })
                .delay(2500)
                .belowTokens()
                .persist()
                .zIndex(0)
            
            super.burstCommon()
                .name("Fallout")
            .file("jb2a.template_circle.symbol.out_flow.poison.dark_green")
            
                .playbackRate(0.4)
                .scale(1.4)
                .delay(2000)
                .opacity(0.5)
                .belowTokens()
                .fadeIn(800)
                .fadeOut(1500)
                .persist()
                .zIndex(1)
            
            super.burstCommon()
                .name("Fallout")
                .file("jb2a.extras.tmfx.outflow.circle.01")
            
                .size(13, { gridUnits: true })
                .opacity(0.7)
                .scaleIn(0, 2500, { ease: "easeOutBack" })
                .scaleOut(0, 6500, { ease: "easeInSine" })
                .filter("ColorMatrix", { brightness: 0 })
                .rotate(90)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 20000 })
                .belowTokens()
                .delay(2000)
                .persist()
                .zIndex(-1)
            return this
        }
        burstAffectHealing({affected=this.affected, caster=this.caster}={}){
            this.effect()
            .file("jb2a.cast_generic.02.green.0")
            .atLocation(affected) 
            .playbackRate(0.5)
            .scaleToObject(1.5)
        
            .fadeIn(500)
            .fadeOut(800)
            .belowTokens()
            .wait(500)


            this.effect()
            .file("jb2a.smoke.puff.ring.01.dark_black.0")
            .atLocation(affected)
    
            .scaleToObject(2)
            .filter("ColorMatrix", { hue: 80, contrast: 1, saturate: 1, brightness: 1 })
            .playbackRate(0.5)
            .zIndex(0.5)
            .wait(500)

            .canvasPan()
            .shake({ duration: 800, strength: 5, rotation: false })


            .wait(2000)
            this.effect()
            .file("jb2a.template_circle.symbol.normal.poison.dark_green")
            .atLocation(affected)
            .scaleToObject(3)
            .fadeIn(800)
            .fadeOut(800)
            .delay(500)
            .zIndex(3)

            this.effect()
            .file("jb2a.smoke.puff.ring.01.dark_black.0")
            .atLocation(affected)
            .scaleToObject(1.8)
            .filter("ColorMatrix", { hue: 80, contrast: 1, saturate: 1, brightness: 1 })
            .playbackRate(0.5)
            .zIndex(3)
            
            .wait(500)

            // Heal animation   
            .effect()
            .file("jb2a.flaming_sphere.200px.green")
            .atLocation(affected)
            .rotate(50)
            .fadeIn(250)
            .fadeOut(250)
            .spriteOffset({ x: canvas.grid.size})
            .scale(0.6)
            .duration(5000)
            .animateProperty("sprite", "position.y", { from: 0, to: -2, duration: 1000, gridUnits: true, fromEnd: false, ease: "easeOutSine" })
            .animateProperty("sprite", "position.x", { from: 1, to: 0, duration: 1500, gridUnits: true, fromEnd: false, ease: "easeOutSine", delay: 300 })
            .zIndex(2)

            this.effect()
            .file("jb2a.flaming_sphere.200px.green")
            .atLocation(affected)
            .spriteOffset({ x: canvas.grid.size })
            .rotate(180)
            .fadeIn(250)
            .fadeOut(250)
            .scale(0.6)
            .duration(5000)
            .animateProperty("sprite", "position.y", { from: 0, to: -2, duration: 1000, gridUnits: true, fromEnd: false, ease: "easeOutSine" })
            .animateProperty("sprite", "position.x", { from: 1, to: 0, duration: 1500, gridUnits: true, fromEnd: false, ease: "easeOutSine", delay: 300 })
            .zIndex(2)

            .effect()
            .file("jb2a.flaming_sphere.200px.green")
            .atLocation(affected)
            .spriteOffset({ x: canvas.grid.size })
            .rotate(310)
            .scale(0.6)
            .fadeIn(250)
            .fadeOut(250)
            .duration(5000)
            .animateProperty("sprite", "position.y", { from: 0, to: -2, duration: 1000, gridUnits: true, fromEnd: false, ease: "easeOutSine" })
            .animateProperty("sprite", "position.x", { from: 1, to: 0, duration: 1500, gridUnits: true, fromEnd: false, ease: "easeOutSine", delay: 300 })
            .zIndex(2)

            this.effect()
            .name("Fallout")
            .file("jb2a.template_circle.symbol.out_flow.poison.dark_green")
            .atLocation(affected)
            .playbackRate(0.4)
            .scaleToObject(1.4)
            .delay(2000)
            .opacity(0.25)
            .belowTokens()
            .fadeIn(800)
            .fadeOut(1500)
            .persist()
            .zIndex(1)

            this.effect()
            .name("Fallout")
            .file("jb2a.extras.tmfx.outflow.circle.01")
            .atLocation(affected)
            .scaleToObject(2)
            .opacity(0.7)
            .scaleIn(0, 2500, { ease: "easeOutBack" })
            .scaleOut(0, 6500, { ease: "easeInSine" })
            .filter("ColorMatrix", { brightness: 0 })
            .rotate(90)
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 20000 })
            .belowTokens()
        //  .delay(2000)
            .persist()
            .zIndex(-1)

            .wait(2500)

            .effect()
            .from(this.caster)
            .delay(500)
            .atLocation(affected)
            .tint("#059c02")
            .fadeIn(750)
            .fadeOut(1000)
            .duration(4000)
            .attachTo(affected)
            .opacity(0)
            .animateProperty("alphaFilter", "alpha", { from: 0, to: -0.2, duration: 1000 })
            .zIndex(1)

            .effect()
            .file("jb2a.energy_strands.range.multiple.dark_green.01")
            .atLocation({ x: affected.x + (canvas.grid.size * -2), y: affected.y - (canvas.grid.size * 1.5) })
            .stretchTo(affected, { gridUnits: true })
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(1)

            this.effect()
            .file("jb2a.energy_strands.range.multiple.dark_green.01")
            .atLocation({ x: affected.x - (canvas.grid.size * -2), y: affected.y - (canvas.grid.size * 1) })
            .stretchTo(affected, { gridUnits: true })
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(1)

            this.effect()
            .file("jb2a.energy_strands.range.multiple.dark_green.01")
            .atLocation({ x: affected.x + (canvas.grid.size * -0.2), y: affected.y + (canvas.grid.size * 1.8) })
            .stretchTo(affected, { gridUnits: true })
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(1)
            .waitUntilFinished(-500)

            this.effect()
            .file("jb2a.healing_generic.burst.yellowwhite")
            .atLocation(affected)
            .attachTo(affected)
            .scaleToObject(1.5)
            .tint("#08a60a")
            .zIndex(5)

            return this
        }
        descriptorLine() {
            this.atLocation(this.templateStart)
                .file("jb2a.breath_weapons.acid.line.green")
                .spriteScale(0.5)
                .aboveLighting()
                .fadeIn(50)
                .fadeOut(50)
                .filter("ColorMatrix", {hue:10, contrast: 0.2, saturate: 0.1,brightness: 0.9,})
                .pause(2000)
            super.lineCommon().file("jb2a.particles.outward.blue.01.04")
                .fadeIn(500)
                .fadeOut(500)
                .anchor({x:0.5})
                .scaleToObject(2)
                .duration(5000)
            // .rotateTowards(this.affected, {cacheLocation: true})
                .loopProperty("sprite", "rotation", { from: -360, to: 360, duration: 3000})
                .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .zIndex(1)
        
            super.lineCommon()
                .file("jb2a.particles.outward.blue.01.04")
                .fadeIn(500)
                .fadeOut(500)
                .anchor({x:0.5})
                .scaleToObject(2) 
                .duration(5000)
            //  .rotateTowards(this.affected, {cacheLocation: true})
                .loopProperty("sprite", "rotation", { from: 360, to: -360, duration: 3000})
                .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .zIndex(1)
            .playSound("modules/lancer-weapon-fx/soundfx/flamethrower_fire.ogg")
                .delay(2500)  
        }
        descriptorCone() {
            this.file('animated-spell-effects-cartoon.electricity.19')  
    //            .rotate(180) 
                .filter("ColorMatrix", { saturation: 1.5, brightness: 1.2, contrast: 1.1, hue: 250 })
                .pause(800)
            return  super.coneCommon()
                .file('animated-spell-effects-cartoon.explosions.04')
                .scale(1.5)
                .filter("ColorMatrix", { hue: 120 }) 
    
        }
        
        affectAffliction2({affected, caster}={})
        {

            super.affectCommon({affected, caster})
                .file("jb2a.token_border.circle.static.blue.006")
                .scaleToObject(2, { considerTokenScale: true })
                .randomRotation()
                .fadeIn(1000)
                .fadeOut(500)
                .opacity(0.8)
                .persist()
                .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
                .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
                .tint("#5dd20f")
            super.affectCommon()
                .from(this.affected)
                .fadeIn(200)
                .fadeOut(500)
                .delay(3000)
                .loopProperty("sprite", "position.x", { from: -0.08, to: 0.08, duration: 50, pingPong: true, gridUnits: true })
            .scaleToObject(this.affected.document.texture.scaleX)
                .duration(10000)
                .opacity(0.25)
            return this
        }
        descriptorAffliction() {
            this.from(this.affected)
            .fadeIn(200)
            .fadeOut(500)
            .delay(800)
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .scaleToObject(this.affected.document.texture.scaleX)
            .duration(3000)
            .opacity(0.25)

            super.affectCommon()
                .from(this.affected)
                .fadeIn(200)
                .fadeOut(500)
                .delay(3000)
                .loopProperty("sprite", "position.x", { from: -0.08, to: 0.08, duration: 50, pingPong: true, gridUnits: true })
                .scaleToObject(this.affected.document.texture.scaleX)
                .duration(10000)
                .opacity(0.25)
            super.affectCommon()
                .file("jb2a.template_circle.symbol.normal.poison.dark_green")
                .scaleToObject(3)
                .fadeIn(800)
                .fadeOut(800)
                .zIndex(3)
                
            super.affectCommon()
                .file("jb2a.smoke.puff.ring.01.dark_black.0")
                .scaleToObject(3)
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .playbackRate(0.5)
                .zIndex(3)
                
            super.affectCommon()
                .file("jb2a.markers.poison.dark_green.02")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .persist()
            return this;
        }
        descriptorAura(){
            return this.file('jb2a.template_circle.symbol.normal.poison.dark_green')
            .scaleToObject(2)
        }
        descriptorBurrowing(position){
            this.file("jb2a.cast_generic.02.green.0")
                .atLocation(this.affected)
                .scaleToObject(2.25)
                .animateProperty("sprite", "width", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "height", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "width", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .animateProperty("sprite", "height", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .playbackRate(0.8)
                .belowTokens()

                .pause(1000)

            super.affectCommon()
                .file("jb2a.impact.earth.01.browngreen.0")
                .atLocation(this.affected)
                .scaleToObject(6)
                .opacity(0.8)

            super.affectCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .atLocation(this.affected)
                .opacity(0.8)
                .belowTokens()
                .scaleToObject(8)
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 1})
                .zIndex(1)

                .animation()
                .delay(1400)
                .on(this.affected)
                .fadeIn(200)

            super.affectCommon()
                .file("modules/animated-spell-effects/spell-effects/misc/skull_blast_CIRCLE_02.webm")
                .filter("ColorMatrix", {brightness: 1, contrast: 1})
                .fadeOut(3000)
                .scaleToObject(6)
                .zIndex(3)
                .waitUntilFinished(-2000)

            super.affectCommon()
                .file("jb2a.impact.ground_crack.02.green")
                .belowTokens()
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 2})
                .fadeOut(1000)
                .scaleToObject(4)
                .zIndex(2)

            super.affectCommon()
                .file("jb2a.ground_cracks.green.02")
                .belowTokens()
                .tint("#0e7c1b")
                .filter("ColorMatrix", {saturate: 1})
                .duration(6000)
                .fadeOut(1000)
                .scaleToObject(4)
                .delay(500)
                .zIndex(1)
        }
        descriptorConcealment()
        {
            this.file("jb2a.smoke.puff.ring.01.dark_black.0")
                    .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                    .delay(505)
                    .scaleToObject(3)
                    .aboveLighting()
                    .playbackRate(0.5);
            return super.concealment();
        }
        descriptorDamage(){
            this.from(this.affected)   
            .fadeIn(200)
            .fadeOut(500)
        
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .scaleToObject(this.affected.document.texture.scaleX)
            .duration(6000)
            .opacity(0.25)
            
            .affectCommon()
        
            .file("jb2a.template_circle.symbol.normal.poison.dark_green")
            .scaleToObject(3)
            .fadeIn(800)
            .fadeOut(800)
            .zIndex(3)

            .pause(500)
            
            .affectCommon()
        
            .file("jb2a.toll_the_dead.green.skull_smoke")
            .scaleIn(0.5, 800, {ease: "easeOutQuint"})
            .fadeIn(500)
            .fadeOut(500)
            .scale(1)
            .filter("Glow", { color: "#0d0d0c", distance: 1, outerStrength: 5, innerStrength: 0 })
            .zIndex(4)
            
            .affectCommon()
        
            .file("jb2a.smoke.puff.ring.01.dark_black.0")
            .scaleToObject(3)
            .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
            .playbackRate(0.5)
            .zIndex(3)
            .pause(1200)

            .affectCommon()
            .file("jb2a.ground_cracks.green.01")
            
            .duration(5000)
            .scaleToObject(2.2)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens()


        
        }
        descriptorDeflection(){
            this.deflectionAnimation='jb2a.bullet.Snipe.green'
            this.file("jb2a.smoke.puff.ring.01.dark_black.0")
                .atLocation(this.affected)
                .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
                .scaleToObject(3)
                .aboveLighting()
                .playbackRate(0.5)
                .wait(1000)

            super.affectCommon()
                .file("jb2a.wall_of_force.sphere.green")
                .atLocation(this.affected)
                .attachTo(this.affected)
                .name("Rad Field")
                .fadeIn(1000)
                .fadeOut(1000)
        }
        meleeAffectDamage({affected, caster}){
            super.affectCommon({affected:affected, caster:caster})
                .file("jb2a.swirling_leaves.outburst.01.pink")
                .scaleIn(0, 500, {ease: "easeOutCubic"}) 
                .filter("ColorMatrix", { saturate: 1, hue: -105 })
                .scaleToObject(0.75)
                .fadeOut(2000)
                .atLocation(this.caster)
                .zIndex(1)
                .recoilAwayFromSelected({affected:this.affected, distance : .25, duration:100, repeats:1})
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.85")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.8)
                .filter("ColorMatrix", {hue: 5, brightness: 1, contrast: 0, saturate: -0.8})
                .randomRotation()
            .playSound()
                .file("modules/lancer-weapon-fx/soundfx/Axe_Hit.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)
            .playSound()
                .file("modules/lancer-weapon-fx/soundfx/Axe_swing.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)
            super.affectCommon()
                .file("jb2a.impact.ground_crack.green.01")
                .scaleToObject(3)
                .randomRotation()
                .belowTokens()
            super.affectCommon()
                .file("jb2a.toll_the_dead.green.skull_smoke")
                .scaleIn(0.5, 800, {ease: "easeOutQuint"})
                .fadeIn(500)
                .fadeOut(500)
                .scale(0.8)
                .filter("Glow", { color: "#0d0d0c", distance: 1, outerStrength: 5, innerStrength: 0 })
                .zIndex(4)
            super.affectCommon()
                .delay(200)
                .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(1.75)
                .opacity(0.5)
                .belowTokens()
            super.affectCommon()
                .delay(200)
                .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.5)
                .opacity(0.5)
                .belowTokens()
            super.affectCommon()
                .from(this.affected)
                .fadeIn(200)
                .fadeOut(500)
                .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(this.affected.document.texture.scaleX)
                .duration(3000)
                .opacity(0.25)
            return this
        }
        descriptorFlight(position){
            this.from(this.affected)
            this.file("animated-spell-effects-cartoon.air.explosion.green")
                .atLocation(this.affected)
                .scaleToObject(3.5)
                .aboveLighting()
                .persist(false)
            .thenDo(async function(){
                Sequencer.EffectManager.endEffects({ name: "flyRad"});
            })
            
            return this
        }
        descriptorSpeed(position){
            super.affectCommon()
                .file("modules/animated-spell-effects/spell-effects/misc/skull_blast_CIRCLE_02.webm")
                .filter("ColorMatrix", {brightness: 1, contrast: 1})
                .fadeOut(3000)
                .scaleToObject(6)
                .zIndex(3)
            return this
        }
        descriptorHealing(){
            
            this.effect()
        .file(`jb2a.token_border.circle.static.blue.003`)
        .atLocation(this.affected)
        .opacity(0.9)
        .size({ width: 2.5, height: 2.5 }, {gridUnits: true})
        .fadeIn(1000, {ease: "easeInExpo"})
        .fadeOut(2500, {ease: "easeInExpo"})
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000})
        .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
        .scaleIn(0, 3000, {ease: "easeOutBack"})
        .scaleOut(0, 3000, {ease: "easeInBack"})
        .tint("#5dd20f")
        .duration(8000)

        .effect()
        .file("jb2a.cast_generic.02.green.0")
        .atLocation(this.affected) 
        .playbackRate(0.5)
        .scale(1)
        .delay(500)
        .fadeIn(500)
        .fadeOut(800)
        .belowTokens()
        .waitUntilFinished(-500)

    .effect()
    .file("jb2a.flaming_sphere.200px.green")
    .atLocation(this.affected)
    .rotate(50)
    .fadeIn(250)
    .fadeOut(250)
    .spriteOffset({x:canvas.grid.size})
    .scaleToObject(0.5)
    .duration(5000)
    .animateProperty("sprite", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, fromEnd: false, ease: "easeOutSine" })
    .animateProperty("sprite", "position.x", { from: 1, to: 0, duration: 1500, gridUnits: true, fromEnd: false, ease: "easeOutSine", delay: 300 })
    .zIndex(2)

    .effect()
    .file("jb2a.flaming_sphere.200px.green")
    .atLocation(this.affected)
    .spriteOffset({x:canvas.grid.size})
    .rotate(180)
    .fadeIn(250)
    .fadeOut(250)
    .scaleToObject(0.5)
    .duration(5000)
    .animateProperty("sprite", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, fromEnd: false, ease: "easeOutSine" })
    .animateProperty("sprite", "position.x", { from: 1, to: 0, duration: 1500, gridUnits: true, fromEnd: false, ease: "easeOutSine", delay: 300 })
    .zIndex(2)

    .effect()
    .file("jb2a.flaming_sphere.200px.green")
    .atLocation(this.affected)
    .spriteOffset({x:canvas.grid.size})
    .rotate(310)
    .scaleToObject(0.5)
    .fadeIn(250)
    .fadeOut(250)
    .duration(5000)
    .animateProperty("sprite", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, fromEnd: false, ease: "easeOutSine" })
    .animateProperty("sprite", "position.x", { from: 1, to: 0, duration: 1500, gridUnits: true, fromEnd: false, ease: "easeOutSine", delay: 300 })
    .zIndex(2)
    
    
    .wait(2500)

        .effect()
    .file("jb2a.detect_magic.circle.green")
    .atLocation(this.affected, { offset: { x:0, y: -45 } } )
    .scaleToObject(2)
    .playbackRate(1)
    .opacity(0.75)
    .mask()
    .fadeIn(500)
    .fadeOut(1000)
    .duration(12250)
    .delay(3000)


    .effect()
        .from(this.affected)
        .delay(500)
        .atLocation(this.affected)
        .tint("#059c02")
        .fadeIn(750)
        .fadeOut(1000)
        .duration(4000)
    // .fadeOut(3500)
        .attachTo(this.affected)
    // .duration(7500)
    .opacity(0.8)
        .animateProperty("alphaFilter", "alpha", { from: 0, to: -0.2, duration: 1000})
        .zIndex(1)

    .effect()
    .file("jb2a.energy_strands.range.multiple.dark_green.01")
    .atLocation({x:this.affected.x+(canvas.grid.size*1.5),y: this.affected.y-(canvas.grid.size*0.4)})
    .stretchTo(this.affected, {gridUnits:true})
    .fadeIn(250)
    .fadeOut(250)
    .zIndex(1)

    .effect()
    .file("jb2a.energy_strands.range.multiple.dark_green.01")
    .atLocation({x:this.affected.x-(canvas.grid.size*0.5),y: this.affected.y-(canvas.grid.size*0.4)})
    .stretchTo(this.affected, {gridUnits:true})
    .fadeIn(250)
    .fadeOut(250)
    .zIndex(1)

    .effect()
    .file("jb2a.energy_strands.range.multiple.dark_green.01")
    .atLocation({x:this.affected.x+(canvas.grid.size*0.5),y: this.affected.y+(canvas.grid.size*1.6)})
    .stretchTo(this.affected, {gridUnits:true})
    .fadeIn(250)
    .fadeOut(250)
    .zIndex(1)
    .waitUntilFinished(-500)

    .effect()
    .file("jb2a.healing_generic.burst.yellowwhite")
    .atLocation(this.affected)
    .attachTo(this.affected)
    .scaleToObject(2)
    .tint("#08a60a")
    .zIndex(5)
        }
        descriptorInsubstantial(){
            this.playSound("https://assets.forge-vtt.com/bazaar/modules/lancer-weapon-fx/assets/soundfx/ptrwht00.wav")
            .delay(1000)
            .file(`jb2a.this.caster_border.circle.static.blue.003`)
            .opacity(0.9)
            .size({ width: 2.5, height: 2.5 }, {gridUnits: true})
            .fadeIn(1000, {ease: "easeInExpo"})
            .fadeOut(2500, {ease: "easeInExpo"})
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000})
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .scaleIn(0, 3000, {ease: "easeOutBack"})
            .scaleOut(0, 3000, {ease: "easeInBack"})
            .tint("#5dd20f")
            .belowTokens()
            .duration(6000)

            super.affectCommon()
            .file("jb2a.cast_generic.02.green.0")
            .playbackRate(0.5)
            .scale(1)
            .delay(500)
            .fadeIn(500)
            .fadeOut(800)
            .belowTokens()
            .waitUntilFinished(-500)
        }
        descriptorProtection(){ 
            this.effect()
            .atLocation(this.affected)
            .file(`jb2a.token_border.circle.static.blue.004`)
            .opacity(0.9)  
            .size({ width: 2, height: 2 }, { gridUnits: true })
            .fadeIn(1000, { ease: "easeInExpo" })
            .fadeOut(2500, { ease: "easeInExpo" })
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000 })
            .filter("ColorMatrix", { hue: -10, contrast: 0.5, saturate: 0.1, brightness: 1 })
            .scaleIn(0, 3000, { ease: "easeOutBack" })
            .scaleOut(0, 3000, { ease: "easeInBack" })
            .tint("#5dd20f")
            .belowTokens()
            .persist()
            return this
        }
        descriptorTransform(){
    
            this.affectCommon()
            .file("jb2a.particles.inward.blue.01.02")
        
            .playbackRate(0.5)
            .scale(1)
            .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
            .duration(3000)
            .fadeIn(500)
            .fadeOut(800)  
        
            .affectCommon()
            .file(`jb2a.token_border.circle.static.blue.003`)
            .opacity(0.9)
            .size({ width: 2.5, height: 2.5 }, {gridUnits: true})
            .fadeIn(1000, {ease: "easeInExpo"})
            .fadeOut(2500, {ease: "easeInExpo"})
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 18000})
            .filter("ColorMatrix", {hue:-10, contrast: 0.5, saturate: 0.1,brightness: 1,})
            .scaleIn(0, 3000, {ease: "easeOutBack"})
            .scaleOut(0, 3000, {ease: "easeInBack"})
            .belowTokens()
            .tint("#5dd20f")
            .duration(8000)
        
            .affectCommon()
            .stretchTo(this.caster) 
            .file("jb2a.disintegrate.green")
            .size({ width: 500, height: 100 })
            .scale(1)
            .filter("ColorMatrix", {hue:10, contrast: 0, saturate: 0.5,brightness: 0.9,})
            .playbackRate(1)
            .scale(2)
            .zIndex(3)
        
            .sound()
            .file("modules/lancer-weapon-fx/soundfx/flamethrower_fire.ogg")
        
            
            this.affectCommon()
            .file("jb2a.template_circle.symbol.normal.poison.dark_green")

            .scaleToObject(3)
            .fadeIn(800)
            .fadeOut(800)
            .zIndex(3)
            
            .affectCommon()
            .file("jb2a.smoke.puff.ring.01.dark_black.0")
            .scaleToObject(3)
            .filter("ColorMatrix", {hue:80, contrast: 1, saturate: 1,brightness: 1,})
            .playbackRate(0.5)
            .zIndex(3)
        
            .affectCommon()
            .file("jb2a.ground_cracks.green.01")
            .delay(2000)
            .duration(5000)
            .scaleToObject(2.2)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens()
            super.transform(); 
            return this

            
        }
    
        /*

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }


        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }

    class SuperSpeedEffectSection extends TemplatedDescriptorEffect {
            constructor(inSequence) {
            super(inSequence);
        }
        meleeDamageCast({caster, affected}) {
            super.castCommon({caster, affected})
            .file('jb2a.flurry_of_blows.physical.orange')
            .filter("ColorMatrix", { hue: 100,saturation: 0, brightness:1.3})
            .from(this.caster)
            .scale(2.5)
            .spriteOffset({x:-50, y: 0})
            .atLocation(this.caster)
            .repeats(6,500)
        .castCommon() 
                .playSound('modules/mm3e-animations/sounds/action/powers/flurryhits.ogg')  
            .pause(2000)
        .castCommon()
            .file('animated-spell-effects-cartoon.simple.63')
            .scale(.5)

            return this;
        }
        
        descriptorCast(){
                this.vibrate(1000)
        }
        descriptorMeleeCast(){
            this.vibrate(1000)
            super.castCommon()  
                .file('jb2a.flurry_of_blows.no_hit.yellow')
                .filter("ColorMatrix", { hue: 100,saturation: 0, brightness:1.3})
                .from(this.caster)
                .scale(2.5)
                .spriteOffset({x:-50, y: 0})
                .repeats(9,500)
            .castCommon() 
                    .playSound('modules/mm3e-animations/sounds/action/powers/Flurry.ogg')  
                .pause(2500)
            .castCommon()
                .file('animated-spell-effects-cartoon.simple.63')
                .scale(.5)
            return this
        }
        descriptorBurst(){
            let points = this.getCircularTemplatePoints(this.affected)
            this.vibrate()
            this.runThroughTemplate(points)
            return this
        }
        descriptorLine(){
            const points = this.getLineTemplatePoints(this.affected);
            this.vibrate();
            this.runThroughTemplate(points);
            return this;
        }   
        descriptorCone(){
            const points = this.getConeTemplatePoints(this.affected);
            this.vibrate();
            this.runThroughTemplate(points);
            return this;
        }
        getCircularTemplatePoints(template) {
            const points = [];
            const stepCount = 4; // Number of pairs across the circle
            const angleStep = (2 * Math.PI) / stepCount; // Angle between each pair in radians

            for (let i = 0; i < stepCount; i++) {
                // Calculate the angle for this step
                const angle = i * angleStep;

                // Calculate the point on one side of the circle
                const x1 = template.x + Math.cos(angle) * template.shape.radius;
                const y1 = template.y + Math.sin(angle) * template.shape.radius;

                // Calculate the opposite point directly across the circle
                const x2 = template.x + Math.cos(angle + Math.PI) * template.shape.radius;
                const y2 = template.y + Math.sin(angle + Math.PI) * template.shape.radius;

                // Add both points
                points.push({ x: x1, y: y1 });
                points.push({ x: x2, y: y2 });
            }

            return points;
        }
        getConeTemplatePoints(template) {
            const points = [];
            const gridSize = canvas.grid.size; // Size of one grid square in pixels
            const length = template.document.distance * gridSize *2/3; // Convert distance to pixels
            const halfAngle = (template.document.angle / 2) * (Math.PI / 180); // Half of the cone's angle in radians
            const direction = template.document.direction * (Math.PI / 180); // Central direction in radians
        
            // Start with the cone's origin (in grid units)
            const origin = { x: template.x, y: template.y };
            points.push(origin);
        
            // Calculate the leftmost edge point
            const leftX = template.x + Math.cos(direction - halfAngle) * length;
            const leftY = template.y + Math.sin(direction - halfAngle) * length;
            const leftPoint = { x: leftX, y: leftY };
            points.push(leftPoint);
        
            // Calculate the rightmost edge point
            const rightX = template.x + Math.cos(direction + halfAngle) * length;
            const rightY = template.y + Math.sin(direction + halfAngle) * length;
            const rightPoint = { x: rightX, y: rightY };
            points.push(rightPoint);
        
            // Calculate the midpoint of the triangle (average of left and right points)
            const midPoint = {
                x: (leftX + rightX) / 2,
                y: (leftY + rightY) / 2,
            };
            points.push(midPoint);
        
            // Calculate the opposite side point (reflect midpoint across origin and scale properly)
            const oppositeX = template.x - (midPoint.x - template.x) * (length / (length + 1));
            const oppositeY = template.y - (midPoint.y - template.y) * (length / (length + 1));
            const oppositePoint = { x: oppositeX, y: oppositeY };
            points.push(oppositePoint);
        
            // Add the final point back to the origin
            points.push(origin);
        
            return points;
        }
        getLineTemplatePoints(template) {
            const points = [];
            const gridSize = canvas.grid.size; // Size of one grid square in pixels
            const length = template.document.distance * gridSize *2/3; // Line length in pixels
            const direction = template.document.direction * (Math.PI / 180); // Line direction in radians
        
            // Start with the line's origin
            const origin = { x: template.x, y: template.y };
            points.push(origin);
        
            // Calculate the endpoint of the line
            const endX = template.x + Math.cos(direction) * length;
            const endY = template.y + Math.sin(direction) * length;
            const endPoint = { x: endX, y: endY };
            points.push(endPoint);
        
            // Add the return point (back to origin)
            points.push(origin);
        
            return points;
        }
        runThroughTemplate( points) { 
        
            const token = this.caster; 
        
            const tokenPosition = { x: token.x, y: token.y };
            let farthestPoint = points[0];
            let maxDistance = 0;
        
            points.forEach((point) => {
                const distance = Math.sqrt(
                    Math.pow(point.x - tokenPosition.x, 2) +
                    Math.pow(point.y - tokenPosition.y, 2)
                );
                if (distance > maxDistance) {
                    maxDistance = distance;
                    farthestPoint = point;
                }
            });

            const reorganizedPoints = [tokenPosition, farthestPoint, ...points, tokenPosition];
            
            super.mm3eEffect()
                .animation()
                .opacity(0)
                .on(token)
                .duration(0);
                
            for (let i = 0; i < reorganizedPoints.length-1; i++) {
                super.mm3eEffect()
                    .file(token.document.texture.src) 
                    .scale(token.document.texture.scaleX) 
                    .opacity(1) 
                    .from(token)
                    .atLocation(reorganizedPoints[i])
                    .moveTowards(reorganizedPoints[i+1], { ease: "easeInOutCubic", rotate: true })
                    .duration(500) 
                    .pause(200)
                    
                super.mm3eEffect()
                    .file("animated-spell-effects-cartoon.energy.16") // Trail animation
                    .scale(4)
                    .atLocation(reorganizedPoints[i])
                    .stretchTo(reorganizedPoints[i+1], { gridUnits: true, proportional: true })
                    .belowTokens()
                    .opacity(0.75)
                    .spriteOffset({ x: -5 }, { gridUnits: true })
                    .filter("ColorMatrix", { brightness: 1.2 })
                    .filter("ColorMatrix", { hue: 330 })
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                super.mm3eEffect()
                    .file("animated-spell-effects-cartoon.simple.23")
                    .filter("ColorMatrix", { hue: 180 })
                    .playbackRate(0.9)
                    .atLocation(reorganizedPoints[i])
                    .stretchTo(reorganizedPoints[i+1], {onlyX:true, offest:{x:-3,y:0} })
                        .scale(.6)
                    .belowTokens()
                    .opacity(0.5)
                    .zIndex(0.3)
                    .fadeOut(300)
                super.mm3eEffect()
                    .file("animated-spell-effects-cartoon.simple.29")
                    .atLocation(reorganizedPoints[i])
                    .rotateTowards(reorganizedPoints[i+1])
                    .scale(0.5 * token.document.texture.scaleX)
                    .belowTokens()
                    .opacity(0.85)
                    .scaleIn(0, 300, { ease: "easeOutExpo" })
                    .spriteRotation(-90)
                    .spriteOffset({ x: -3, y: -0.1 }, { gridUnits: true })
                super.mm3eEffect()
                    .delay(100)
                    .file("animated-spell-effects-cartoon.simple.05")
                    .filter("Glow", { color: 0x29c9ff })
                    .spriteOffset({x: 0.5, y: 0.5}, {gridUnits:true})
                    .randomRotation()
                    .scale(.3)
                    .atLocation(reorganizedPoints[i])   
                .sound('modules/mm3e-animations/sounds/power/super%20speed/move%20quick.ogg')
            }
            
            this.mm3eEffect()
                .animation()
                .opacity(0)
                .on(token)
                .duration(0)
            this.mm3eEffect()
                .animation()
                .opacity(1)
                .on(token)
                .duration(0);
        }
        vibrate(duration=3000)
            {
                this.playSound('modules/mm3e-animations/sounds/power/super%20speed/wiff.ogg')
                .castCommon({rotation:false})
                    .file('animated-spell-effects-cartoon.simple.117')
                    .scale(.5)
            .castCommon({rotation:false})
                .from(this.caster)
                .fadeIn(200)
                .fadeOut(500)
                .loopProperty("sprite", "position.x", { from: -0.10, to: 0.10, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(this.caster.document.texture.scaleX)
                .duration(3000)
                .opacity(0.25)
            return this;
        }

        descriptorProject(){
            let origin = this.getTokenCenter(this.caster);
            let destination =this.getNearestTokenSide(origin, this.affected)
            this.speed({caster:this.caster, position:destination})
            function timerPromise(delay) {return new Promise((resolve) => setTimeout(resolve, delay));}  
            //give the attack sequence time to run
            timerPromise(1500).then(() => 
            new Sequence().superSpeedEffect().cast(this.caster).speed({caster:this.caster, position:origin}).play()
        )

        }
        descriptorProjectToCone(){
            return this
        }
        descriptorProjectToLine(){
            return this
        }

        descriptorAffect(){
            this.descriptorAffectAura()
        }
        descriptorAffectAura(persist){
            let duration
            if(!persist)
            {
                duration = 3000
            }
            this.playSound('modules/mm3e-animations/sounds/power/super%20speed/wiff.ogg')
            .fluctuate(duration)
            
            return this;
        }
        descriptorAffliction({affected}={}){
            this.playSound('modules/mm3e-animations/sounds/action/powers/phase2.ogg')
            .fluctuate()
            super.affectCommon()
            .file('animated-spell-effects-cartoon.cantrips.mending.blue')
            .scale(.4)
            .filter("ColorMatrix" , { hue:500,contrast: 0, saturate: 0,brightness: 1})
            .persist()
            return this
        }
        fluctuate(duration){
                this.thenDo(async ()=>{
                let filter = "fluctuating" + Math.random().toString()
                let params =
                [{
                    filterType: "images",
                    filterId: filter,
                    time: 0,
                    nbImage:4,
                    alphaImg: 1.0,
                    alphaChr: 0.0,
                    blend: 4,
                    ampX: 0.2,
                    ampY: 0.2,
                    padding: 10,
                    zOrder: 20,
                    animated :
                    {
                        time: 
                        { 
                        active: true, 
                        speed: 0.1110, 
                        animType: "move" 
                        },
                        ampX:
                        {
                        active: true,
                        val1: 0.00,
                        val2: 0.0030,
                        chaosFactor: 0.03,
                        animType: "syncChaoticOscillation",
                        loopDuration: 2000
                        },
                        ampY:
                        {
                        active: true,
                        val1: 0.00,
                        val2: 0.030,
                        chaosFactor: 0.04,
                        animType: "syncChaoticOscillation",
                        loopDuration: 1650
                        },
                        alphaChr:        
                        { 
                        active: true, 
                        animType: "randomNumberPerLoop", 
                        val1: 0.0, 
                        val2: 1,
                        loopDuration: 250
                        },
                        alphaImg:        
                        { 
                        active: true, 
                        animType: "randomNumberPerLoop", 
                        val1: 0.8, 
                        val2: 0.1,
                        loopDuration: 250
                        },
                        nbImage:
                        {
                        active: true,
                        val1: 1,
                        val2: 4,
                        animType: "syncSinOscillation",
                        loopDuration: 1400
                        }
                    }
                }];
                
                    this.affected.TMFXaddFilters(params);
                    if(duration){
                        function timerPromise(delay) {return new Promise((resolve) => setTimeout(resolve, delay));}  //give the rest of the sequence time to run
                        
                        timerPromise(duration).then(() => 
                            TokenMagic.deleteFilters(this.affected,filter));
                    }
                })
        }

        descriptorSpeed(position){
            this.castCommon()
            .file("animated-spell-effects-cartoon.smoke.01")
            .rotateTowards(position)
            .scaleToObject(1.75)
            .belowTokens()
            .opacity(0.65)
            .scaleIn(0, 300, {ease: "easeOutExpo"})
            .filter("ColorMatrix", { saturate: 0, brightness: 1 })
            .spriteRotation(-90)
            .spriteOffset({x:-1}, {gridUnits :true})

            this.castCommon()
                .file("jb2a.smoke.puff.side.dark_black.4")
                .scaleToObject(2)
                .rotateTowards(position)
                .fadeOut(200)
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0, brightness: 1 })
                .moveTowards(position,{rotate:false, ease:"easeOutCirc"})
                .spriteRotation(180)
                .spriteOffset({x:-1.75}, {gridUnits :true})
                .moveSpeed(1500)
                .zIndex(0.3)

            this.castCommon()
                .file("jb2a.energy_strands.range.standard.grey")
                .stretchTo(position)
                .belowTokens()
                .opacity(0.5)
                .repeats(3,50,50)
                .spriteOffset({x:0}, {gridUnits :true})
                .filter("ColorMatrix", { saturate: 0, brightness: 2 })
                .randomizeMirrorY() 
                .fadeOut(200)
                .zIndex(0.2)

            .effect()
                .file("animated-spell-effects-cartoon.magic.mind sliver")
                .delay(50)
                .atLocation(this.caster)
                .stretchTo(position)
                .belowTokens()
                .opacity(1)
                .spriteOffset({x:0}, {gridUnits :true})
                .filter("ColorMatrix", { saturate: 0, brightness: 1,contrast:0 })
                .randomizeMirrorY()
                .fadeOut(200)
                .zIndex(0.21)

            this.castCommon()
                .file("animated-spell-effects-cartoon.smoke.99")
                .filter("ColorMatrix", {brightness: 1, contrast: 1.5, saturate:0})
                .spriteOffset({ x: -3, y: -1 }, { gridUnits: true })
                .atLocation(position)
                .rotateTowards(this.caster)
                .rotate(90)
                .scaleToObject(5, {considerTokenScale: true})

        return this;
        
        }

    }
    class SuperStrengthEffectSection extends TemplatedDescriptorEffect {  
        constructor(inSequence) {
            super(inSequence);
        }
        castSlam({caster}={}){  
                
                super.castCommon({caster:caster, affected:caster}) 
              //  let fs = new FlightEffect(this);
                this.start({caster:this.caster})
                this.end({caster:this.caster})
            return this
        }

        descriptorCastFlight(){
            return this.start();
        }
  
        meleeCast({caster, affected, repeats=1}={} ){
            super.meleeCastCommon({caster:caster, affected:affected})
            .file("jb2a.melee_attack.02.trail") 
            .scale(this.caster.document.width*.5, {gridUnits:true})
            .spriteOffset({x:-0.7*this.caster.document.width},{gridUnits:true})
                .rotateTowards(this.affected)
            .filter("ColorMatrix", {
                hue: 500, // Keep hue neutral for grey
                contrast: 0, 
                saturate: 0, // Set saturation to 0 to remove color
                brightness: 1
            })
            .lungeTowardTarget({scale:1})
            return this;
        }

        cast({caster, affected}={}){
            this.castCommon({caster:caster, affected:affected})
                .file("jb2a.melee_generic.slash.01.orange").spriteOffset({x:20, y:-10})
                .scaleToObject(1.5)
                .zIndex(1)
                .filter("ColorMatrix", {
                    hue: 500, 
                    contrast: 1, 
                    saturate: 0, 
                    brightness: 3 
                })        
            .repeatEffect()
                   .mirrorY()
            .castCommon()
                 .file("jb2a.impact.001.orange")
                .scaleToObject(2)
                .filter("ColorMatrix", {
                    hue: 50,
                    contrast: 1,
                    saturate: 0,
                    brightness: 1
                })
              .playSound("modules/mm3e-animations/sounds/action/powers/Hit6.ogg")
            return this;
        }

        descriptorCastLeaping({position}={}){
           this
            .playSound("modules/mm3e-animations/sounds/action/powers/Whoosh2.ogg")
            .file("jb2a.smoke.puff.ring.02.white")
            .scaleToObject(1)
            .opacity(.5)
            .belowTokens()     
        this.castCommon()
            .file("jb2a.wind_stream.white")
            .anchor({ x: 0.5, y: .5 })
            .opacity(2)
            .scale(this.caster.width / canvas.grid.size * 0.025)
            .mirrorX()
            .zIndex(1)
        return this
        }

        burst({caster, affected}={}){
            super.burstCommon({caster:caster, affected:affected})
                .file(`animated-spell-effects-cartoon.simple.47`)
                .scaleToObject(3)
            return this
        }

        burstSlam({caster,affected}={}){
            super.shake({strength:150, duration:1500, rotation:false, fadeOutDuration:1000})
            super.burstCommon({caster:caster, affected:affected})
                .file("jb2a.impact.ground_crack.02.white")
            return this
        }

        burstDazzle({caster,affected}={}){
            super.burstCommon({caster:caster, affected:affected})
                .file("animated-spell-effects-cartoon.energy.pulse.blue") 
                .filter("ColorMatrix", {
                    hue: 50,         
                    contrast: 0,     
                    saturate: 0,    
                    brightness: 5   
                })  
                .duration(600)
                .playSound('modules/mm3e-animations/sounds/action/powers/Shadowpunch4.ogg')
                .pause(600)
            .repeatEffect().playSound('')
                    .filter("ColorMatrix", {
                        hue: 50,         
                        contrast: 0,     
                        saturate: 0,    
                        brightness: 5   
                    }) 
            super.shake({strength:150, duration:1500, rotation:false, fadeOutDuration:1000})
            return this
        }

        projectToCone({caster, affected}={}){
            super.projectToConeCommon()
            //  affected = canvas.templates.placeables[0]
            const coneStart = { x: this.affected.x, y: this.affected.y };
            this.mm3eEffect() 
                .atLocation(this.caster)
                .aboveLighting()
                .stretchTo(coneStart)
                //super.projectToConeCommon({caster:caster, affected:affected})
                .file('animated-spell-effects-cartoon.air.bolt.square')
                .playSound('modules/mm3e-animations/sounds/action/powers/whoosh8.ogg')

            return this
        }   

        cone({caster, affected}={}){
            super.coneCommon({caster:caster, affected:affected})
                .file("animated-spell-effects-cartoon.energy.blast.03") 
                .aboveLighting()
                .filter("ColorMatrix", {
                    hue: 0,
                    contrast: 1,
                    saturate: 0,
                    brightness: 1
                })
            return this
        }

        line({caster, affected}={}){
            super.lineCommon({caster:caster, affected:affected})
                .file("jb2a.wind_stream") 
                .aboveLighting()
                .filter("ColorMatrix", {
                    hue: 0,
                    contrast: 1,
                    saturate: 0,
                    brightness: 3
                })
                .filter("ColorMatrix",{            
                    saturation: 0, 
                    brightness: 1.5 
                })
                .scale({ x: 1, y: 0.1 })
            return this
        }

        descriptorAura(){
            this.file('animated-spell-effects-cartoon.energy.flash')
                .scale(.2)
                .spriteOffset({x:0 ,y:70})
             
           // .pause(500)  
            .affectCommon()
                .delay(-8000)
                .file('animated-spell-effects-cartoon.smoke.57')
             //   this.spriteOffset({x:0 ,y:70})
                .scaleToObject(2)
             
            return this
        }

        affectAffliction({affected}={}){
            //super.affectCommon({affected:affected})
            this.affectDamage({affected:affected,persistent:true})
                
            return this
        }

        affectDamage({affected = this.affected, persistent=false}){   

            this.affect({affected:affected})
            this.file("jb2a.dizzy_stars.200px.yellow")
                //.scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(1)
                .opacity(1)
                .attachTo(affected, {offset:{y:-0.5*affected.document.width}, gridUnits:true})
                .persist(persistent)
            .affect()
                .file("animated-spell-effects-cartoon.misc.spark") 
                .scale(affected.document.width*.65, {gridUnits:true})
                .playSound("modules/mm3e-animations/sounds/action/powers/PunchHit*.ogg")
            .recoilAwayFromSelected({affected:affected})
            .pause(1000)
            .affect()
                .from(affected)
                .fadeIn(200)
                .fadeOut(500)
                .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(affected.document.texture.scaleX)
                .duration(1500)
                .opacity(0.25)
            return this
        } 


        descriptorLeaping(){
            this.affectCommon()
            this.playSound("modules/mm3e-animations/sounds/action/powers/SpringAttack_Land_01.ogg")
            .shake({ duration: 1000, strength: 75, rotation: false, fadeOutDuration: 800 })
            .playSound("modules/mm3e-animations/sounds/action/powers/Whoosh2.ogg") 
            .pause(400)
            .file("jb2a.impact.ground_crack.02.white")
            return this
        }

        descriptorProtection(){    
            this.effect()
            .atLocation(this.affected)
            .file(`animated-spell-effects-cartoon.flash.21`)
            .tint("#808080")
            .opacity(0.9)  
            .size({ width: 2, height: 2 }, { gridUnits: true })
            .fadeIn(1000, { ease: "easeInExpo" })
            .fadeOut(2500, { ease: "easeInExpo" })
            .filter("ColorMatrix", { hue: +60, contrast: 0.5, saturate: 0, brightness: 1 })
            .playbackRate(0.25)
            .scaleIn(0, 3000, { ease: "easeOutBack" })
            .scaleOut(0, 3000, { ease: "easeInBack" })
            .belowTokens()
            .persist()
            this.playSound('modules/mm3e-animations/sounds/Spells/Buff/spell-buff-build-up-2.mp3')
            return this
        }

        start({caster}={}){
            this.castCommon({caster:caster, affected:caster})
              //  .loopUp({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(90)
                .scaleToObject(1) 
                .filter("ColorMatrix" , {
                        hue: 500, 
                        contrast: 0, 
                        saturate: 0,
                        brightness: 1
                    })
                .repeatEffect()    //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: 25})
                    .playSound("modules/mm3e-animations/sounds/action/powers/whoosh9.ogg")
                .repeatEffect()   //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: -25})
                    .pause(900)
                return this;
            }
        
        end({caster}={}){
                this.castCommon({caster:caster, affected:caster})
              //  .loopDown({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false}
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(270)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                        hue: 500, 
                        contrast: 0, 
                        saturate: 0,
                        brightness: 1
                    })
            .repeatEffect()   //inherit last effect with any modifications we want below
                .spriteOffset({x:0, y: 25})
            .repeatEffect()   //inherit last effect with any modifications we want below
                .playSound("modules/mm3e-animations/sounds/action/powers/Whoosh2.ogg")
                .spriteOffset({x:0, y: -25})
            
            return this;
        }


        descriptorFlight(){
            this.end({caster:this.affected})
                .affectCommon()
                .file ("jb2a.impact.ground_crack.02.white")
              //  .rotation( 270)
                .scale( .75)
                .filter( "ColorMatrix" , 
                    {hue: 500, 
                    contrast: 0, 
                    saturate: 0,
                    brightness: 1,
                })
        }
    }

    class FlightEffect  {
        constructor(originalEffectSection){
            this.originalEffectSection = originalEffectSection
        }

        start({caster}={}){
            this.originalEffectSection.castCommon({caster:caster, affected:caster})
                .loopUp({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(90)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                        hue: 500, 
                        contrast: 0, 
                        saturate: 0,
                        brightness: 1
                    })
                .repeatEffect()    //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: 25})
                    .playSound("modules/mm3e-animations/sounds/action/powers/whoosh9.ogg")
                .repeatEffect()   //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: -25})
                    .pause(900)
                return this.originalEffectSection;
            }
        
        end({caster}={}){
                this.originalEffectSection.castCommon({caster:caster, affected:caster})
                .loopDown({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})

                .castCommon()
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(270)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                        hue: 500, 
                        contrast: 0, 
                        saturate: 0,
                        brightness: 1
                    })
            .repeatEffect()   //inherit last effect with any modifications we want below
                .spriteOffset({x:0, y: 25})
            .repeatEffect()   //inherit last effect with any modifications we want below
                .playSound("modules/mm3e-animations/sounds/action/powers/Whoosh2.ogg")
                .spriteOffset({x:0, y: -25})
                .pause(300)
            .endMovement()
            return this.originalEffectSection;
        }
    }

    class WaterEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
            this.leaves = 'pink'
        }
        /* castCone({affected, caster}={}){
            return this
        }*/

        descriptorCast(){
                super.castCommon({rotation:false})
                .file("jb2a.particles.outward.blue.01.04")
                .fadeIn(500)
                .fadeOut(500)
                .scaleToObject(6)
                .duration(5000)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0, 5000, {ease: "easeOutQuint", delay: -3000})
                .zIndex(1)
            super.castCommon()
                .file("jb2a.particles.outward.blue.01.03")
                .anchor({x:0.4})
                .scaleToObject(1.75)
                .animateProperty("sprite", "position.x", { from: 0, to: -1000, duration: 15000})
                .rotateTowards(this.affected, {cacheLocation: true})
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .duration(6000)
                .playbackRate(2)
                .fadeOut(2000)
                .delay(4000)
                .zIndex(2)
            .sound().file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-water-jet-1.mp3")
            .delay(10)
            super.castCommon({rotation:false})
                .file("animated-spell-effects-cartoon.mix.water.01")
                .playbackRate(1.3)
                .delay(2000)
                .scaleToObject(2)
                .waitUntilFinished(-2000)
            return this;
        }
        descriptorMeleeCast(){
            this.file("jb2a.cast_generic.water.02.blue")
                .playbackRate(1.3)
                .scale(1)
                .belowTokens()
                .waitUntilFinished(-1500)
            .meleeCastCommon({rotation:false}) 
                .file("animated-spell-effects-cartoon.water.79")
                .attachTo(this.caster, { align: "center", edge: "outer", offset: { x: 0, y: 0 }, gridUnits: true, local:true })
                .scale(0.3)
                .delay(500)
            .meleeCastCommon({rotation:false})
                .file("jb2a.unarmed_strike.physical.02.blue")
                .atLocation(this.caster, { edge: "outer" })
                .stretchTo(this.affected)
                .filter("ColorMatrix", { hue: 0, brightness: 1, contrast: 0, saturate: 0 })
                .scale(3)
                .delay(100)
                .playbackRate(1.25)
                .fadeOut(100)
                .zIndex(2)
            .pause(750) 
            .meleeCastCommon({rotation:false})
                .file("jb2a.swirling_leaves.outburst.01.pink")
            .scaleIn(0, 500, {ease: "easeOutCubic"}) 
            .filter("ColorMatrix", { saturate: 1, hue: -105 })
            .scaleToObject(0.75)
            .fadeOut(2000)
            .zIndex(1)
        .meleeCastCommon()   
            .lungeTowardTarget()
            .duration(600)
            .scaleToObject(1, {considerTokenScale: true})
            .delay(600)      
            .canvasPan()
                .delay(250)
                .shake({duration: 250, strength: 2, rotation: false })

            return this
        }
        castPersonal({caster,affected}={}){
            super.castCommon({caster:caster,affected:affected}={})
                .file("animated-spell-effects-cartoon.water.create.01")
                .scale(0.4)
                .aboveLighting()
            super.castCommon()
                .file("jb2a.impact.water.02.blue.0")
                .playbackRate(1)
                .scale(0.8)
                .delay(400)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-water-jet-1.mp3")
                .delay(10)
            return this
        }
        castLine({caster, affected=this.firstTemplate}={}){
            super.castCommon({caster:caster, affected:affected,rotation:false})
            .file("jb2a.cast_generic.water.02.blue")
            .playbackRate(1)
            .scale(1)
            .belowTokens()       
        
            super.castCommon()
                .file("jb2a.liquid.splash_side.blue")
                .attachTo(this.caster, { align: "center", edge: "on", offset: { x: -0.5, y: 0 }, gridUnits: true, local:true })
                .rotateTowards(this.affected)
                .delay(2000)
        
                super.castCommon()
                .file("animated-spell-effects-cartoon.water.79")
                .attachTo(this.caster, { align: "center", edge: "outer", offset: { x: 0, y: 0 }, gridUnits: true, local:true })
                .rotateTowards({
                    x:  this.affected.center.x,
                    y:  this.affected.center.y + this.randomYOffset
                    })
                .scale(0.5)
                .delay(2000)
                return this
        }
        descriptorCastBurrowing(position){
                let hue = 140
                let saturate = -0.3
                let  tint = "#1a57a8"
                this.affectCommon({caster:caster, affected:affected})
            this.file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .scaleToObject(2.25)
            .fadeOut(300)
            .tint(tint)
            .filter("ColorMatrix", { saturate: saturate })
            .animateProperty("sprite", "width", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens()

            super.affectCommon()
            .file("jb2a.cast_generic.water.02.blue")
            .attachTo(this.caster)
            .playbackRate(1.3)
            .scale(1)
            .belowTokens()
            .waitUntilFinished(-1200)

            super.affectCommon()
            .delay(1300)
            .file("jb2a.impact.water.02.blue.0")
            .size(4, {gridUnits:true})
            .waitUntilFinished(-3000)

            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .delay(0)
                .scale(1)

            super.affectCommon()
            .file("animated-spell-effects-cartoon.water.85")
            .scaleToObject(4)
            .opacity(0.8)

            super.affectCommon()
                .file("jb2a.liquid.splash_side.blue")
                .rotateTowards(position)

            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.79")
                .rotateTowards(position)
                .scale(0.5)

            .pause(500)

            super.affectCommon()
            .file("jb2a.burrow.out.01.still_frame.0")
            .duration(5000)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens()
            .scaleToObject(6)
            .tint(tint)
            .filter("ColorMatrix", { hue: hue })
            .zIndex(1)

            super.affectCommon()
            .file("jb2a.template_line_piercing.water.01.blue")
            .opacity(1)
            .scale(this.caster.w / canvas.grid.size)
            .stretchTo(position)
            .zIndex(1)
            return this

        }
        descriptorCastLeap(position){
            this.file("jb2a.cast_generic.water.02.blue")
            .attachTo(this.caster)
            .playbackRate(1.3)
            .scale(1)
            .belowTokens()

            super.castCommon()
            .file(`jb2a.swirling_leaves.complete.02.${this.leaves}`)
            .scaleToObject(2.25)
            .fadeOut(300)
            .filter("ColorMatrix", { saturate: saturate })
            .animateProperty("sprite", "width", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "height", { from: this.caster.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
            .animateProperty("sprite", "width", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .animateProperty("sprite", "height", { from: 0, to: this.caster.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
            .playbackRate(2)
            .belowTokens() 
            .tint(tint)
            .pause(1000)
            super.castCommon()
            .delay(1300)
            .file("animated-spell-effects-cartoon.water.11")
            .size(3, {gridUnits:true})
            .opacity(0.8)
        // .waitUntilFinished(-2000)

            return true
        }
        descriptorCastTeleport(position){}
        descriptorCastSpeed(position){
            
            this.file("jb2a.energy_attack.01.blue")
                .randomSpriteRotation()
                .playbackRate(1)
                .delay(0)
                .scale(0.5)
            super.castCommon()
                .file("jb2a.particle_burst.01.circle.green")
                .filter("ColorMatrix", {hue: 0, contrast: 0.5, saturate: 0})
                .opacity(0.8)
                .tint("#1a57a8")
                .playbackRate(1.5)
                .randomSpriteRotation()
                .scaleToObject(3)
                .pause(2500)
            super.castCommon()
                .file("animated-spell-effects-cartoon.air.puff.01")
                .scaleToObject(4)
            // .waitUntilFinished(-2000)
            super.castCommon()
                .file("jb2a.liquid.splash_side.blue")
                .rotateTowards(position)
            super.castCommon()
                .file("animated-spell-effects-cartoon.water.79")
                .rotateTowards(position)
                .scale(0.5)
                .pause(100)
            super.castCommon()
                .file("jb2a.template_line_piercing.water.01.blue.15ft")
                .filter("ColorMatrix", { hue: 15, saturate: -0.6, contrast: 2})
                .opacity(0.6)
                .playbackRate(1.5)
                .spriteOffset({x: -2}, {gridUnits: true})
                .stretchTo(position, {cacheLocation: true})
            //   .waitUntilFinished(-1200)
            super.castCommon()
                .file("animated-spell-effects-cartoon.smoke.99")
                .filter("ColorMatrix", {brightness: 1, contrast: 1.5})
                .spriteOffset({ x: -2.5, y: -1 }, { gridUnits: true })
            .rotateTowards(this.caster)
                .rotate(90)
                .scaleToObject(5, {considerTokenScale: true})
            return this;
        }
        descriptorCastFlight(position){}
        descriptorProject() {
            return this.file("jb2a.template_line_piercing.water.01.blue")
                .delay(500)
                .waitUntilFinished(-3000)
                
                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Ray/spell-ray-2.mp3")
                .volume(1);;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   
        descriptorBurst() {
            return this.waterExplosion();
        }

        burstCreate({caster,affected}={}){
                super.burstCommon({caster:caster,affected:affected}).file("animated-spell-effects-cartoon.mix.water.01")
                .attachTo(this.affected)
                .playbackRate(1.3)
                .delay(0)
                .opacity(0.8)
                .scaleToObject(1)
            super.burstCommon()
                .file("animated-spell-effects-cartoon.water.create.01")
                .attachTo(this.affected)
                .playbackRate(0.8)
                .delay(0)
                .scaleToObject(1)
            return this.waterExplosion();
        }
        burstTransform({affected, caster}={})
        {
            return this.burstCreate({affected:affected, caster:caster})
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                .scaleToObject(3)
                .endTime(2600)
                .randomRotation()
                .noLoop()
                .persist()
                .belowTokens()
                .fadeOut(1000)
                .scaleIn(0, 600, {ease: "easeOutCubic"})
        }
        
        burstDamage({caster,affected}={}){
            let sound = 'modules/dnd5e-animations/assets/sounds/Spells/Create-or-Destroy-Water.mp3'
            super.burstCommon({caster:caster, affected:affected})
            this.waterExplosion({caster, affected, sound})
            return this
            
        }
        waterExplosion({affected,caster, sound="modules/dnd5e-animations/assets/sounds/Damage/Acid/acid-bubbling-2.mp3"}={}){
            this.file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleToObject (1.7)
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .zIndex(2)
                .sound()
                .file(sound)
                .delay(0)
            super.affectCommon()
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                .scaleToObject(3)
                .endTime(2600)
                .noLoop()
                .persist()
                .belowTokens()
                .fadeOut(1000)
                .scaleIn(0, 600, {ease: "easeOutCubic"})
            
                let delayDuration = 10000;
                let  splashFilters = {
                    name: "splash"
            };

            function endEffectsWithDelay(filters, delay) {
                setTimeout(() => {
                Sequencer.EffectManager.endEffects(filters);
                }, delay);
            }
            endEffectsWithDelay(splashFilters, delayDuration);
            return this;
        }
        
        burstHealing({caster,affected}={}){
            super.burstCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleToObject (1.7)
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .zIndex(2)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-short-5.mp3")
                .delay(1000)
                super.burstCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(-35)
                .playbackRate(1)
                .scale(0.5)
                super.burstCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.2, y: 0.45 })
                .rotate(35)
                .playbackRate(1)
                .scale(0.5)
                .mirrorX()
                super.burstCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(90)
                .playbackRate(1)
                .scale(0.5)   
                super.burstCommon()
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                    .scaleToObject(3)
                    .endTime(2200)
                    .noLoop()
                    .persist()
                    .belowTokens()
                    .fadeOut(1000)
                    .scaleIn(0, 600, {ease: "easeOutCubic"})
            super.burstCommon()
                    .file("jb2a.healing_generic.burst.bluewhite")        
                    .opacity(1)
                    .scaleToObject(1)
            return this
        }
        waterSwirls(){
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleToObject (1.7)
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .zIndex(2)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-short-5.mp3")
                .delay(1000)
                super.affectCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(-35)
                .playbackRate(1)
                .scale(0.5)
                super.affectCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.2, y: 0.45 })
                .rotate(35)
                .playbackRate(1)
                .scale(0.5)
                .mirrorX()
                super.affectCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(90)
                .playbackRate(1)
                .scale(0.5)   
                super.affectCommon()
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                    .scaleToObject(3)
                    .endTime(2200)
                    .noLoop()
                    .persist()
                    .belowTokens()
                    .fadeOut(1000)
                    .scaleIn(0, 600, {ease: "easeOutCubic"})
            super.affectCommon()
                    .file("jb2a.healing_generic.burst.bluewhite")        
                    .opacity(1)
                    .scaleToObject(1)
        }
        descriptorLine() {
                    this.file("jb2a.impact.water.02.blue.0")
                .atLocation(this.templateStart)
                .scaleToObject(2)
                .delay(2000)
                .fadeIn(100)
                .fadeOut(100)

            this.atLocation(this.templateStart)
            super.lineCommon()
                this.file("jb2a.breath_weapons.acid.line.green")
                .atLocation(this.templateStart)
                .spriteScale(2)
                .stretchTo(this.affected)
                .aboveLighting()
                .delay(-4000)
                .filter("ColorMatrix", {hue:50, contrast: 0.7, saturate: -0.2,brightness: 0.4,})
                .playbackRate(1)
                .fadeIn(50)
                .fadeOut(50)
            return this

        }

        lineCreate(){
            super.lineCommon()
                .descriptor
                .file("jb2a.impact.water.02.blue.0")
                .atLocation(this.templateStart)
                .scaleToObject(2)
                .delay(2000)
                .fadeIn(100)
                .fadeOut(100)
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .atLocation(this.center)
                .scaleToObject(5)
                .delay(2000)
                .fadeIn(100)
                .fadeOut(100)
            return this
        }
        descriptorCone() {
            return this;
        }

        waterImpact()
        {
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.85")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.8)
                .filter("ColorMatrix", {hue: 5, brightness: 1, contrast: 0, saturate: -0.8})
                .randomRotation()
                .sound()
                .file("modules/lancer-weapon-fx/soundfx/Axe_Hit.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)
                .sound()
                .file("modules/lancer-weapon-fx/soundfx/Axe_swing.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.5)              
                .randomRotation()
                .belowTokens()
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(4)
                .randomRotation()
                .belowTokens()
            return this
        }
        waterPulse()
        {
            super.affectCommon()
                .delay(200)
                .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(1.75)
                .opacity(0.5)
                
                .belowTokens()
            super.affectCommon()
                .delay(200)
                .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.5)
                .opacity(0.5)
                .belowTokens()
            return this
        }
        waterBall(){
                return super.affectCommon()
                .file("animated-spell-effects-cartoon.water.ball")   
                .attachTo(this.affected)
                .playbackRate(1)
                .scaleToObject()
                .scale(1.2)
                .fadeIn(500)
                .fadeOut(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .persist()
        }
        descriptorAffliction() { 
            this.waterExplosion()
                .waterImpact()
                .waterBall()
            this.waterPulse()
            super.affectCommon()
            .from(this.affected)
                .fadeIn(200)
                .fadeOut(500)
                .delay(2000)
                .loopProperty("sprite", "position.x", { from: -0.1, to: 0.1, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(this.affected.document.texture.scaleX)
                .duration(3000)
                .opacity(0.25)
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorBurrowing(position){
            let hue = 140
        
            let saturate = -0.3
            let tint = "#1a57a8" 
            this.file(`jb2a.swirling_leaves.complete.02.${leaves}`)
                .atLocation(this.affected)
                .scaleToObject(2.25)
                .fadeOut(300)
                .tint(tint)
                .filter("ColorMatrix", { saturate: saturate })
                .animateProperty("sprite", "width", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "height", { from: this.affected.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "width", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .animateProperty("sprite", "height", { from: 0, to: this.affected.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .playbackRate(2)
                .belowTokens()
            .pause(1000)
            super.affectCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .atLocation(this.affected)
                .opacity(0.8)
                .fadeIn(50)
                .belowTokens()
                .scaleToObject(4)
                .zIndex(1)
            .animation()
            .delay(1400)
            .on(this.affected)
            .fadeIn(200)
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.85")
                .playbackRate(1)
                .scale(0.5)
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .scaleToObject(5)
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .delay(0)
                .opacity(0.5)
                .scale(1)
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .atLocation(this.affected)
                .opacity(0.9)
                .scaleToObject(5)
                .fadeIn(100)
                .fadeOut(1000)
                .duration(3000)
                .belowTokens()
                .waitUntilFinished(-2000)
            return this
        }

        descriptorDamage(){
            this.waterImpact()
            this.from(this.affected)
                .fadeIn(200)
                .fadeOut(500)
                .delay(3000)
                .loopProperty("sprite", "position.x", { from: -0.1, to: 0.1, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(this.affected.document.texture.scaleX)
                .duration(3000)
                .opacity(0.25)
            return this.waterPulse()
        }
        descriptorHealing(){ 
            this.waterSwirls()
            this.file("jb2a.impact.water.02.blue.0")
                .scaleToObject(2)
                .delay(1000)
            super.affectCommon()
                .file("jb2a.healing_generic.400px.blue")
                .scaleToObject(2.5)
                .delay(1200)
            return this
        }

        descriptorInsubstantial(){
            this.playSound("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-water-jet-1.mp3")
                .delay(10)
            .affectCommon()
                .file("jb2a.cast_generic.water.02.blue")
                .playbackRate(1.5)
                .scale(1)
                .belowTokens()
                .waitUntilFinished(-1200)
            .affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .delay(800)
                .scale(1)
            .affectCommon()
                .file("animated-spell-effects-cartoon.water.create.01")
                .delay(505)
                .scale(0.4)
                .aboveLighting()
        }

        descriptorCreate(){
            return this.waterImpact()
        }
        descriptorAura(){
            return this.file("animated-spell-effects-cartoon.water.create.01")
            .scale(0.4)
            .aboveLighting()
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .playbackRate(1)
                .scale(0.8)
                .delay(400)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-water-jet-1.mp3")
                .delay(10)
        }
        descriptorProtection(){
            return this.affectAura()
                .waterBall()
        }
        descriptorSpeed(position){
            super.castCommon()
                .file("animated-spell-effects-cartoon.water.81")
                .filter("ColorMatrix", {brightness: 1, contrast: 1})
                .spriteOffset({ x: -2.5, y: -2 }, { gridUnits: true })
                .rotateTowards(position)
                .rotate(-90)
                .scaleToObject(5, {considerTokenScale: true})
                .belowTokens()
            return this
        }
    /*
        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }



        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/

    }

    class WebEffectSection extends TemplatedDescriptorEffect{
        constructor(){
            super("webEffect")
        }
   
        descriptorMeleeCast(){
            return this.file('jb2a.melee_generic.creature_attack.fist')
            .rotateTowards(this.affected)
            .scaleToObject(2)
            .filter("ColorMatrix", { hue: 0, brightness: 1, contrast: 0, saturate: -1 })
            return this;
        }

        descriptorCastSwing(){
            
        }

        descriptorCast(){
            return this.file("jb2a.impact.005.orange")
          //  .atLocation(token)
            .scale(0.3)
            .aboveLighting()
            .rotateTowards(this.affected)
            .scaleIn(0, 200, { ease: "easeOutCubic" })
            .filter("ColorMatrix", { saturate: -1 })
        .castCommon()
            .file("jb2a.particles.outward.white.01.02")
            .scaleIn(0, 500, { ease: "easeOutQuint" })
            .fadeOut(1000)
            .duration(1000)
            .size(1.75, { gridUnits: true })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
            .zIndex(1)
        
            
        }

        castBall({caster:caster, affected:affected}={}){
            this.castCommon({caster:caster, affected:affected})
            .file("jb2a.cast_generic.01.yellow.0") 
            .scaleToObject(2)
            .filter("ColorMatrix", { saturate: -1 })
            .playbackRate(0.8)
            .fadeIn(500)
            .fadeOut(100)
            .belowTokens()
            .waitUntilFinished()
         .castCommon()
            .file("jb2a.impact.005.orange")
            .scale(0.3)
            .aboveLighting()
            .rotateTowards(this.affected)
            .scaleIn(0, 200, { ease: "easeOutCubic" })
            .filter("ColorMatrix", { saturate: -1 })

         .castCommon()
            .file("jb2a.particles.outward.white.01.02")
            .scaleIn(0, 500, { ease: "easeOutQuint" })
            .fadeOut(1000)
          
            .duration(1000)
            .size(1.75, { gridUnits: true })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
            .zIndex(1)

            return this
        }

        descriptorProject(){
            this.playSound('modules/mm3e-animations/sounds/power/webbing/web*.ogg')
            this.projectCommon().file('modules/makeitshiny-dnd5e/Spells/2nd_Level/Web/Throw/Throw.webm')
            .waitUntilFinished(-100)
            return this
        }


        projectBall({caster, affected}={}){
            return this.castCommon({caster:caster, affected:affected})
                .file('jb2a.markers.light_orb.loop.white')
               
                .moveTowards(this.affected)
                .moveSpeed(1000)
                .scaleToObject(0.6)
                .zIndex(1)
                .waitUntilFinished(-100)
        }
        projectMultiAttack({caster, affected}={}){
            this.projectCommon({caster:caster,affected:affected})
            .delay(-300)
            return this.file("jb2a.fireball.beam.blue")
            .filter("ColorMatrix",{hue:0, saturate: -1, brightness:0.7, contrast: 0.8})
            .stretchTo(this.affected, {randomOffset: 0.65, attachTo: true})
            .fadeIn(500)
            .fadeOut(2500, {ease:"easeOutCubic"})
            .repeats(9,2,1)
            .zIndex(1.1)
            .scale(0.25)
            .opacity(0.75)
            .pause(2400)
        }

        projectDazzle({caster, affected}={}){
            this.projectCommon({affected, caster})
            return this.file("jb2a.fireball.beam.blue")
            .filter("ColorMatrix",{hue:0, saturate: -1, brightness:0.7, contrast: 0.8})
            .stretchTo(this.affected, { offset: { x: -50, y: -50 }, local: true })
            .fadeIn(500)
            .fadeOut(2500, {ease:"easeOutCubic"})
            .zIndex(1.1)
            .scale(0.25)
            .opacity(0.75)
            .playbackRate(4)
            .pause(550)
        }
        projectAffliction(){
            return this.project()
        }

        projectToCone({caster, affected}={}){
            this.initializeTemplateVariables()
            this.castCommon({caster:caster, affected:affected})
                .file('jb2a.markers.light_orb.loop.white')
               
                .moveTowards(this.templateStart)
                .moveSpeed(1000)
                .scaleToObject(0.6)
                .zIndex(1)
                .waitUntilFinished(-100)
            return this
        }
        projectToLine({caster, affected}={}){
            return this.projectToCone({caster:caster, affected:affected})
        }

        descriptorBurst(){
           return  this.file("jb2a.impact.004.yellow")
                .scaleToObject(1)
                .scaleIn(0, 200, { ease: "easeOutCubic" })
                .filter("ColorMatrix", { saturate: -1, brightness: 1.5 })
                .pause(100)
            .burstCommon()
                .file('modules/animated-spell-effects/spell-effects/misc/web_spider_realistic_CIRCLE_01.webm')
                .filter("ColorMatrix", { saturate: -1, brightness: 1.5 })
                .belowTokens()
                .fadeIn(1500)
                .zIndex(1)
                .fadeOut(1500)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .scaleToObject(1)
                .loopOptions({ maxLoops: 1, endOnLastLoop:true })
                .persist()
                .pause(200)
            .repeatEffect()
        }
        
        burstThick({caster,affected}={}){
            return this.burstCommon( {caster:caster,affected:affected})
            .file("jb2a.impact.004.yellow")
            .scaleToObject(1)
            .scaleIn(0, 200, {ease: "easeOutCubic"})
            .filter("ColorMatrix", { saturate: -1 })

            .burstCommon()
            .file('jb2a.web.01')
            .belowTokens()
            .fadeIn(1500)
            .zIndex(1)
            .fadeOut(1500)
            .scaleIn(0, 500, {ease: "easeOutCubic"})
            .scaleToObject(1)
            .persist()
            .pause(600) 
            .repeatEffect()
        }

        descriptorCone(){ 
            return this.file('jb2a.cone_of_cold.blue')
            //tint grey
            .filter("ColorMatrix", { saturate: -.9, brightness:1 })  
            .playbackRate(4)
        }
        descriptorLine(){
            return this.descriptorCone()
        }

        descriptorAffliction(){
            this.affectCommon()
                .file("jb2a.impact.004.yellow")
                .scaleToObject(2)
                .scaleIn(0, 200, { ease: "easeOutCubic" })
                .filter("ColorMatrix", { saturate: -1 , brightness: 2})
                .pause(100)
            .affectCommon()
                .file('modules/animated-spell-effects/spell-effects/misc/web_spider_realistic_CIRCLE_01.webm')
                .opacity(1.5)
                .duration(3000)
                .zIndex(1)
                .fadeOut(1500)
                .spriteRotation(30)
              this.filter("ColorMatrix", { saturate: -1, brightness: 1.5})
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .scaleToObject(0.8)
                .anchor({ x: 0.7, y: 0.8 })
                .persist()
        this.repeatEffect()
            this.anchor({ x: 0.2, y: 0.5 })
             this.filter("ColorMatrix", { saturate: -1, brightness: 1.5})
         this.repeatEffect()
            this.anchor({ x:.8, y:-0.1 }) 
             this.filter("ColorMatrix", { saturate: -1, brightness: 1.5})
        this.repeatEffect()
            this.anchor({ x:.5, y:0.2 })   
             this.filter("ColorMatrix", { saturate: -1, brightness: 1.5})
        this.resistAndStruggle()
            return this
        }
        descriptorAura(){
            return this
            .file('animated-spell-effects-cartoon.level 01.divine favour')
            .filter("ColorMatrix", { brightness:1, hue: 0, contrast: 0, saturate: -1 })
            .scaleToObject(1)
            .affectCommon()
            .file('modules/makeitshiny-dnd5e/Spells/2nd_Level/Web/Area/Web.webm')
            .scaleToObject(1)
            .rotateIn(360, 5000, { ease: "linear" }) 
            .belowTokens()
        }

        descriptorDamage(){
            this.recoilAwayFromSelected({distance:.02, repeats:1})
            this.affectCommon()
                .file("jb2a.impact.004.yellow")
                .scaleToObject(.5)
                .scaleIn(0, 200, { ease: "easeOutCubic" })
                this.filter("ColorMatrix", { saturate: -1, brightness: 2})
                .delay(-800)
            this.repeatEffect()
                this.anchor({ x: -.2, y: -.7}) 
                this.filter("ColorMatrix", { saturate: -1, brightness: 2})
            this.repeatEffect()
                .filter("ColorMatrix", { saturate: -1, brightness: 2})
                this.anchor({ x: .9, y: -.7})    
            this.repeatEffect()
                this.anchor({ x: -.5, y: 1.1}) 
                .filter("ColorMatrix", { saturate: -1, brightness: 2})
            this.repeatEffect()
                this.anchor({ x: 0, y: 0})  
                this.filter("ColorMatrix", { saturate: -1, brightness: 2})      
            this.repeatEffect()
                this.anchor({ x: .5, y: 1.1}) 
                .filter("ColorMatrix", { saturate: -1, brightness: 2})
      
            this.affectCommon()
                .file('modules/animated-spell-effects/spell-effects/misc/web_spider_realistic_CIRCLE_01.webm')
                .opacity(1.5)
                .duration(3000)
                .zIndex(1)
                .fadeOut(1500)
                .spriteRotation(30)
                .filter("ColorMatrix", { brightness: .9, contrast: 1, saturate: 0 })
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .scaleToObject(0.4)
                .anchor({ x: .7, y: 1.5 })
        this.repeatEffect()
            this.anchor({ x: -.2, y: -.7}) 
            .filter("ColorMatrix", { brightness: .9, contrast: 1, saturate: 0 })
        this.repeatEffect()
        this.filter("ColorMatrix", { brightness: .9, contrast: 1, saturate: 0 })
            this.anchor({ x: .9, y: -.7}) 
           
        this.repeatEffect()
            this.anchor({ x: -.5, y: 1.1}) 
            this.filter("ColorMatrix", { brightness: .9, contrast: 1, saturate: 0 })
        this.repeatEffect()
            this.anchor({ x: 0, y: 0})  
            this.filter("ColorMatrix", { brightness: .9, contrast: 1, saturate: 0 }) 
            
        this.repeatEffect()
            this.anchor({ x: .5, y: 1.1}) 
            this.filter("ColorMatrix", { brightness: .9, contrast: 1, saturate: 0 })

           
            .delay(-3000)
    
            return this    
        }

        descriptorDeflection(){
            this.deflectionAnimation='jb2a.bullet.Snipe.blue.05ft'
            this.file("modules/makeitshiny-dnd5e/Spells/2nd_Level/Web/Area/Web.webm")
            .rotateIn(360, 1000, { ease: "linear" }) 
            .scaleToObject(1)
            .fadeIn(500)
            .fadeOut(500)
            .pause(800)

            .affectCommon()
            .file("modules/animated-spell-effects/spell-effects/misc/web_spider_realistic_CIRCLE_01.webm")
            .scaleToObject(1.5)
            .fadeIn(500)
            .fadeOut(500)
            .duration(3000)
          //  .persist(false)
            .play();

            this.initalizeRandomNumbers();
        }
        descriptorDazzle(){
            this.affectCommon()
            .delay(-1000)
                .file("jb2a.impact.004.yellow")
                .scaleToObject(0.3)
                .scaleIn(0, 200, { ease: "easeOutCubic" })
                .filter("ColorMatrix", { saturate: -1 , brightness: 2})
                .pause(100)
                .anchor({ x: 0.6, y: 1.9 })
            .affectCommon()
                .file('modules/animated-spell-effects/spell-effects/misc/web_spider_realistic_CIRCLE_01.webm')
                .opacity(1.5)
                .duration(3000)
                .zIndex(1)
                .fadeOut(1500)
                .spriteRotation(30)
                .spriteRotation(30)
                .anchor({ x: 0.6, y: 1.9 })
                this.filter("ColorMatrix", { saturate: -1, brightness: 1.5})
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .scaleToObject(0.3)
                .delay(-1000)
                .persist()
                .attachTo(this.affected)
            return this
        }
        descriptorHeal(){}    
       
        descriptorProtection(){
            return this
                .file('animated-spell-effects-cartoon.level 01.divine favour')
                .filter("ColorMatrix", { brightness:1, hue: 0, contrast: 0, saturate: -1 })
                .scaleToObject(1)
            .affectCommon()
                .file('jb2a.markers.shield_rampart.complete.03.white')
                .scaleToObject(1)
            .affectCommon()
                .file('modules/makeitshiny-dnd5e/Spells/2nd_Level/Web/Area/Web.webm')
                .scaleToObject(1)
                .rotateIn(360, 6800, { ease: "linear" }) 
                .belowTokens()
                .persist()
                .pause(800)
            .affectCommon()
                .file('modules/makeitshiny-dnd5e/Spells/2nd_Level/Web/Area/Web.webm')
                .scaleToObject(1)
                .rotateIn(360, 6000, { ease: "linear" }) 
                .belowTokens()
                return this
        }
        affectSenses({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            this.file('animated-spell-effects-cartoon.electricity.wave')
            .spriteOffset({x:25, y:0})
            .scaleToObject(.45)
            .rotate(90)
            .belowTokens()
            .filter("ColorMatrix", {hue: 0, contrast: 0, saturate: 0})
            .tint('0x000000')
            .playSound('modules/mm3e-animations/sounds/action/powers/CrabEye_loop.ogg')
            return this;
        }
        descriptorSnare(){
            return this.affectCommon()
            .file('modules/makeitshiny-dnd5e/Spells/2nd_Level/Web/Area/Web.webm')
            .scaleToObject(1.5)
            .zIndex(12)
            .persist()
            .resistAndStruggle()

        }

        descriptorSwing(){}
        

    }
    Sequencer.SectionManager.registerSection("myModule", "mm3eEffect", BaseEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "powerEffect", PowerEffectSection) 
    Sequencer.SectionManager.registerSection("myModule", "noDescriptorEffect", NoDescriptorEffectSection)

    Sequencer.SectionManager.registerSection("myModule", "airEffect",AirEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "colorEffect",ColorEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "cosmicEffect",CosmicEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "curseEffect",CurseEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "darknessEffect",DarknessEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "earthEffect",EarthEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "electricityEffect",ElectricityEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "energyEffect",EnergyEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "entropyEffect",EntropyEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "exoskeletonEffect",ExoskeletonEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "fireEffect",FireEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "gasEffect",GasEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "iceEffect",IceEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "holyEffect",HolyEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "impactEffect",ImpactEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "insectEffect",InsectEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "invincibleEffect",InvincibleEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "kineticEffect",KineticEffectSection)
    //Sequencer.SectionManager.registerSection("myModule", "lightEffect",LightEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "lightningEffect",LightningEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "magnetismEffect",MagnetismEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "magicEffect",MagicEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "plantEffect",PlantEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "poisonEffect",PoisonEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "psychicEffect",PsychicEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "radiationEffect",RadiationEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "superSpeedEffect",SuperSpeedEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "superStrengthEffect",SuperStrengthEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "waterEffect",WaterEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "webEffect",WebEffectSection)

    let selected 
  

   


});

class SequenceRunnerEditor {
    constructor({html=undefined,foundryApplication}={}) {
        this.foundryApplication = foundryApplication;
        this.descripterView = new DescriptorSequenceView(this);
        this.scriptView = new SequencerScriptView(this)
        if(html){
            this.html = html;
        }
        
        return new Dialog( 
        {
            title: "Select Effect, Cast, and Project Methods to generate  a sequencer script  for your power",
            content: `<form>
                ` + this.descripterView.content +
                this.scriptView.content
                + `
            </form>
                `
            ,
            buttons: {  
                cancel: {
                    label: "Cancel",  
                }, 
            },
            render: (html) => {
                this.html = html; 
            
                this.moveDialogueToFarRightOfCanvas();
                this.descripterView.registerOnDescriptorSelected();
                this.scriptView.registerOnSaveClicked();
                this.scriptView.registerOnRunClicked();
                this.scriptView.registerOnNameChanged();
                this.descripterView.updateFromPowerItem();
                
                this.descripterView.update()   
                this.scriptView.updateFromPowerItem();
                this.scriptView.update()

                const saveButton = $('<button type="button">Save</button>');
                saveButton.on('click', async () => {
                    await this.scriptView.save();
                    // Prevent the dialog from closing
                });
                html.closest('.dialog').find('.dialog-buttons').append(saveButton);
            }
        }, 
        {
            width: 800,
            height: 1200, 
            resizable: true
        }
        ).render(true);
    }

    moveDialogueToFarRightOfCanvas() {
        const canvasWidth = canvas.screenDimensions[0]; // Get canvas width
        const dialogWidth = 800; // Match the width defined for the dialog
        const dialogHeight = 600; // Match the height defined for the dialog
        this.html.closest(".dialog").css({
            position: "absolute",
            left: `${canvasWidth - dialogWidth - 10}px`, // Position 10px from the right edge
            top: `10px`, // Position 10px from the top
            width: `${dialogWidth}px`,
            height: `${dialogHeight}px`
        }); 
    }
}  
let selected
class GameHelper{ 
    static waitForTemplatePlacement() {
    selected = canvas.tokens.controlled[0]
        if(!canvas.templates.placeables[0]){
            ui.notifications.warn("Waiting for template placement to target tokens before rolling attack");
            return new Promise( (resolve) => {
                Hooks.once("createMeasuredTemplate", async (template) => {
                    console.log("Template placed:", template);
                    clearTimeout(timeout)
                    selected.control()
                    resolve(template);                
                });
                const timeout = setTimeout(() => {
                ui.notifications.warn("Template placement timed out.");
                //reject(new Error("Template placement timed out after 10 seconds."));
                }, 10000); 
            });
        }
    }
    static get selected(){
        return canvas.tokens.controlled[0];
    }

    static get targeted(){
        return Array.from(game.user.targets)[0];
    }

    static get target(){
        return Array.from(game.user.targets)[0];
    }

    static get selectedTokens(){
        return canvas.tokens.controlled;
    }

    static get selecteds(){
        return canvas.tokens.controlled;
    }
    static get targetedTokens(){
        return Array.from(game.user.targets); 
    }

    static async targetWithCrossHair( {icon ='icons/skills/movement/feet-winged-boots-brown.webp', label ='target'}={}){
        let selected = GameHelper.selected
        let config = {
            size: 2,
            icon: icon, 
            label: label,
            drawIcon: true,
            drawOutline: true,
            interval: 1 % 2 === 0 ? 1 : -1,
        }
        let position =   await warpgate.crosshairs.show(config);
        //make sure this in repo
        selected.control()
        return position
    }

    static get targets(){
        return Array.from(game.user.targets);
    }

    static get template(){
        return canvas.templates.placeables[0];
    }

    static async sleep (ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    } 

    static async placeSummonedActor ({actor}={}){
        let position = await GameHelper.targetWithCrossHair({icon:actor.data.token.img, label:actor.name})
        let summmon
        if(actor){
            summon = await actor.sheet.actor.createEmbeddedDocuments("Token", [{x:position.x, y:position.y}])
        }
        else{ 
            actor = await Actor.create({ name: "Summoned", type: "personnage" });
        }
        const tokenData = actor.getTokenData();
        tokenData.update({
            x: position.x,
            y: position.y,
            vision: true, 
            scale: 1,
            disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
        });
        const scene = game.scenes.active;
        await TokenDocument.create(tokenData, { parent: scene });
    }

    static async placeEffectTargeter (effectType){
        let position = await GameHelper.targetWithCrossHair({icon:'modules/mm3e-animations/power-icons/' + effectType +'.webp', label:effectType})
        return position;
    }

    static async placeCreationTile ({power, width=150, height=150}={}){
        let position = await GameHelper.targetWithCrossHair({icon:'modules/mm3e-animations/power-icons/' + power +'.webp', label:power})
        //  const swingPointAnimation =Sequencer.Database.getEntry(animation).originalData
        const tileData = { 
            img: 'modules/mm3e-animations/tiles/' + power +'.webp',//swingPointAnimation, 
            x: position.x-width/2,  
            y: position.y-height/2,
            width: width,
            height: height,
            flags: {
                tag: this.name 
            },
        };
        const [tile] = await canvas.scene.createEmbeddedDocuments("Tile", [tileData]);
        //  await tile.update({"texture.tint":tint})
        await tile.update({'texture.src': 'modules/mm3e-animations/tiles/'+
            power +'.webm'})
        return tile
    }

    static transformToken(power, token){
        let image = 'modules/mm3e-animations/tiles/' + power +'.webp'
        //update the token image
        token.update({img: image})  
    }

    static get whiteColorFilter() {
        let f =  
        {
                filterType: "ColorMatrix",
                filterId: "whiteColorFilter",
                values: {
                    saturation: 0, 
                    brightness: 1.5 
                }
        };
        return f;
    }

    static get GreyTransparentFilter(){
        let f = 
        {
                filterType: "ColorMatrix",
                filterId: "GreyTransparentFilter",
                values: {
                    saturation: 0, // Desaturate completely to make it grey
                }
        }
        return f;
    }

    
    static SequenceRunnerHelper(app) {
        const helper = new SequenceRunnerEditor({foundryApplication: app});
        

        
        // Initialize the Affect Types system
    
        
    }   
} 


class AffectedByPowerSequence{
    constructor(descriptorSequence) {
        this.descriptorSequence = descriptorSequence;
        this.affectedType = "target";
    }
    updateFrom(powerItem){
        if((powerItem.range=="Range" || powerItem.range=="melee") || powerItem.areaShape){
            this.affectedType = "target";
        }
        else{
            if(powerItem.range=="Personal"){
                this.affectedType = "selected";
            }
        }
    }
}
class AffectedByPowerSequenceView{
    constructor(sequenceRunnerEditor) {
        this.sequenceRunnerEditor = sequenceRunnerEditor;
        this.affectedByPowerSequence = this.sequenceRunnerEditor.descripterView.descriptorSequence.affectedByPowerSequence
    }
    get html() {
        return this.sequenceRunnerEditor.html;
    }
    get chosen() {
        return this.html.find('[name="who-is-affected"]:checked').val(); 
    }
    set chosen(affectedType) {    
        const affectedRadio = this.html.find(`#affected-${affectedType}`);
        this.affectedByPowerSequence.affectedType = affectedType;
        affectedRadio.prop("checked", true).trigger("change");

        
    }
    update(){
        const areaMethodsContainer = document.querySelector("#who-is-selected-choices");
        this.html.find("input[type='radio'][name='who-is-affected']").on("change", async () =>{
            this.affectedByPowerSequence.affectedType = this.chosen;
            this.sequenceRunnerEditor.scriptView.generate()      
        }                                                        
    );
        this.chosen = this.affectedByPowerSequence.affectedType;
    }
    updateFrom(powerItem){
        this.affectedByPower.updateFrom(powerItem);
        this.chosen = this.affectedByPower.affectedType;
    }
    get content() {
        return `<fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
            <legend>Choose who the affected target will be, the selected ( caster) or targeted token Affected</legend>
            <div id="who-is-selected-choices" style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                <div>
                    <input type="radio" id="affected-target" name="who-is-affected" value="target" checked>
                    <label for="affected-target">Target</label>
                </div>
                <div>
                    <input type="radio" id="affected-selected" name="who-is-affected" value="selected">
                    <label for="affected-selected">Selected</label>
                </div>
            </div>
        </fieldset>`;
    } 

}
class BaseSequence {
    constructor(descriptorSequence, methodType) {
        this.descriptorSequence = descriptorSequence;
        this.methodType = methodType; // e.g., "Cast", "Project", etc.
        this.sourceMode = "descriptor"; // Default source mode
    }

    setSourceMode(mode) { 
        this.sourceMode = mode;
    }

    get methods() {
        const descriptor = this.descriptorSequence.selectedDescriptor;

        return this.getMethods({
            descriptorFilter: method => method.toLowerCase().includes(this.methodType.toLowerCase()),
            macroFilter: (name, descriptor) => name.startsWith(`${descriptor}-${this.methodType}`),
            autorecFilter: (label, descriptor) => {
                let result = label.startsWith(`${descriptor}-${this.methodType}`)
                 console.log(`Filtering entry: ${label} starts with ${descriptor}, result: ${result}`);
                return result
            }
        });
    }

    getMethods(filters) {
        const descriptor = this.descriptorSequence.descriptorName;

        switch (this.sourceMode) {
            case "descriptor":
                return this.getDescriptorMethods(filters.descriptorFilter);
            case "macro":
                return this.getMacroMethods(descriptor, filters.macroFilter);
            case "autorec":
                return this.getAutoRecMethods(descriptor, filters.autorecFilter);
            default:
                return [];
        }
    }

    getDescriptorMethods(descriptorFilter) {
        const allMethods = this.descriptorSequence.methods;
        return allMethods
            .filter(descriptorFilter)
            .map(method => ({
                original: method,
                display: method.replace(/descriptor/i, "").trim()
            }));
    }

    getMacroMethods(descriptor, macroFilter) {
        return game.macros.contents
            .filter(macro => macroFilter(macro.name, descriptor))
            .map(macro => ({
                original: macro.name,
                display: macro.name.replace(`${descriptor}-${this.methodType}-`, "").trim()
            }));
    }

    getAutoRecMethods(descriptor, autorecFilter) {
        const melee =  game.settings.get("autoanimations", "aaAutorec-melee")
        const range =  game.settings.get("autoanimations", "aaAutorec-range")
        const ontoken =   game.settings.get("autoanimations", "aaAutorec-ontoken")
        const preset =   game.settings.get("autoanimations", "aaAutorec-preset")
        const templatefx =   game.settings.get("autoanimations", "aaAutorec-templatefx")
    
        const allEntries = [...melee, ...range, ...ontoken, ...preset, ...templatefx];
        return allEntries
        .filter(entry => {
        const result = autorecFilter(entry.label, descriptor);
       
        return result;
    })
    .map(entry => {
        const displayLabel = entry.label.replace(`${descriptor}-${this.methodType}-`, "").trim();
        console.log(`Mapping entry: ${entry.label}, display: ${displayLabel}`);
        return {
            original: entry.label,
            display: displayLabel
        };
    });
    }
    
}

class PowerEffectSequence{
    constructor(descriptorSequence) {
        this.descriptorSequence = descriptorSequence;
        this.selectedEffectMethods = [];
    }

    updateFrom(powerItem){
        let powerEffect = powerItem.effect;
        powerEffect = powerEffect?powerEffect.replace(/\s/g, ''):undefined;
        if(powerEffect){
            this.selectedEffectMethods = [{ original: "affect" + powerEffect, display: powerEffect }];
        }
    }

    get methods() {
        const powerEffectClass = Sequencer.SectionManager.externalSections["powerEffect"];
        const methodNames = Object.getOwnPropertyNames(powerEffectClass.prototype)
                .filter(name=> name.startsWith("affect") && 
                typeof powerEffectClass.prototype[name] === "function"
            );
        return methodNames.map((methodName) => ({
            original: methodName, // Original method name
            display: methodName.replace(/^affect/, "").replace(/([A-Z])/g, " $1").trim() // Strip "affect" and format
        }));
    }

    get hasMovementEffect(){
        //look for all movements in the selected effects
        const array = ['Burrow', 'Leap', 'Swim', 'Flight', 'Teleport', 'Speed'];
        for (let i = 0; i < this.descriptorSequence.powerEffectSequence.selectedEffectMethods.length; i++) {
            if (array.some(effect =>
                this.descriptorSequence.powerEffectSequence.selectedEffectMethods[i].original.includes(effect))) {
                return true
            } else {
            return false
            }
        }
        return false
    }
}
class PowerEffectsSequenceView{
    constructor(sequenceRunnerEditor) {
        this.sequenceRunnerEditor= sequenceRunnerEditor;
        this.powerEffectSequence = this.sequenceRunnerEditor.descripterView.descriptorSequence.powerEffectSequence;
        
    }
    get html() {
        return this.sequenceRunnerEditor.html;
    } 
    
    get selectedEffects() {
        let selectedPowerEffectRows = this.html.find("#power-effect-methods-table tbody tr");
        let selectedPowerEffectMethods=[];
        selectedPowerEffectRows.each((index, row) => {
            const powerEffect = $(row).find('select[name="power-effect-method"]').val();
            if (powerEffect) selectedPowerEffectMethods.push(powerEffect);
        });
        selectedPowerEffectMethods =selectedPowerEffectMethods.map((methodName) => ({
            original: methodName, // Original method name
            display: methodName.replace(/^affect/, "").replace(/([A-Z])/g, " $1").trim() // Strip "affect" and format
        }));
        return selectedPowerEffectMethods; 
    }
    set selectedEffects(powerEffectMethods) {
        const tbody = this.html.find("#power-effect-methods-table tbody");
    
        powerEffectMethods.forEach((type) => {
            // Check if the power effect already exists in the table
            const exists = tbody.find(`select[name="power-effect-method"] option[value="${type.original}"]`).length > 0;
    
            if (!exists) {
                const row = $("<tr>");
                const select = $("<select>")
                    .attr("name", "power-effect-method")
                    .css("width", "100%");
                
                $("<option>")
                    .val(type.original)
                    .text(type.display)
                    .appendTo(select);
    
                select.on("change", () => {
                    this.powerEffectSequence.selectedEffectMethods = this.selectedEffects    
                    this.sequenceRunnerEditor.scriptView.generate();
                });
                row.append($("<td>").append(select));
                row.append(
                    $("<td>").append(
                        $("<button>")
                            .text("− Remove")
                            .css({ color: "red", marginLeft: "10px" })
                            .on("click", () => {
                                row.remove();
                                this.sequenceRunnerEditor.scriptView.generate();
                            })
                    )
                );
    
                tbody.append(row);
            }
        });
        this.powerEffectSequence.selectedEffectMethods= powerEffectMethods
        this.sequenceRunnerEditor.scriptView.generate();
    }

    updateFrom(powerItem){
        this.powerEffectSequence.updateFrom(powerItem);
        this.selectedEffects = this.powerEffectSequence.selectedEffectMethods;
    }

    update() {
        const selectedPowerEffectsTable = document.querySelector("#power-effect-methods-table");
        const addselectPowerEffectRowButton = document.querySelector("#add-affect-row");
        const powerEffectMethods =this.methods;
        if (powerEffectMethods.length === 0) {
            const row = selectedPowerEffectsTable.querySelector("tbody").insertRow();
            row.innerHTML = `<td colspan="2">No affect methods available</td>`;
            return;
        }
        addselectPowerEffectRowButton.addEventListener("click", () => {
            this.addPowerEffect(selectedPowerEffectsTable, powerEffectMethods)
            this.powerEffectSequence.selectedEffectMethods = this.selectedEffects
            this.sequenceRunnerEditor.scriptView.generate()

        });
        this.selectedEffects = this.powerEffectSequence.selectedEffectMethods;
        
    }
    get content() {
        return `<fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
            <legend>Power Effects</legend>
            <div id="power-effect-methods-container">
                
                <table id="power-effect-methods-table" style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        <!-- Rows will be dynamically added here -->
                    </tbody>
                </table>
                <button id="add-affect-row" type="button" style="margin-top: 10px;">+ Add Selection</button>
            </div>
        </fieldset>`;
    }
    addPowerEffect(affectTable, powerEffectMethods) {
        const tbody = affectTable.querySelector("tbody");
        const row = tbody.insertRow();
    
        // Dropdown for selecting affect method
        const selectCell = row.insertCell();
        const select = document.createElement("select");
        select.name = "power-effect-method";
        select.style.width = "100%";
        powerEffectMethods.forEach(({ original, display }) => {
            const option = document.createElement("option");
            option.value = original;
            option.textContent = display;
            select.appendChild(option);
        });
        selectCell.appendChild(select);
        select.addEventListener("change", () => {
            this.powerEffectSequence.selectedEffectMethods = this.selectedEffects
            this.sequenceRunnerEditor.scriptView.generate();
        });
    
        // Remove button
        const removeCell = row.insertCell();
        const removeButton = document.createElement("button");
        removeButton.textContent = "− Remove";
        removeButton.type = "button";
        removeButton.style.color = "red";
        removeButton.style.marginLeft = "10px";
        removeButton.addEventListener("click", () => {
            row.remove();
                this.powerEffectSequence.selectedEffectMethods = this.selectedEffects
                this.sequenceRunnerEditor.scriptView.generate(); // Re-trigger script generation when a row is removed
            });
            removeCell.appendChild(removeButton);
            this.sequenceRunnerEditor.scriptView.generate();
    } 
    get methods() { 
        return this.powerEffectSequence.methods
    }
    get hasMovementEffect(){
        return this.powerEffectSequence.hasMovementEffect
    }
} 

class AreaSequence extends BaseSequence {
    constructor(descriptorSequence) {
        super(descriptorSequence, "Area"); // Pass "Area" as methodType
        this.method = "none";
    }

    updateFrom(powerItem) {
        if (powerItem.areaShape) {
            const areaMethods = this.methods;

            if (areaMethods && areaMethods.length > 0) {
                const areaShapeMethod = areaMethods.find(method =>
                    method.original.toLowerCase().includes(powerItem.areaShape.toLowerCase())
                );

                const areaShapeMethods = areaMethods.filter(method =>
                    method.original.toLowerCase().includes(powerItem.areaShape.toLowerCase())
                );

                let effectMatchingAreaShapeMethod;
                if (areaShapeMethods) {
                    effectMatchingAreaShapeMethod = areaShapeMethods.find(method =>
                        method.original.toLowerCase().includes(powerItem.effect?.toLowerCase())
                    );
                }

                this.method = effectMatchingAreaShapeMethod
                    ? effectMatchingAreaShapeMethod.original
                    : areaShapeMethod.original;
            } else if (areaMethods.length > 0) {
                this.method = areaMethods[0].original;
            }
        }
    }   

    get methods() {
        let methods =  this.getMethods({
            descriptorFilter: method =>
                ["burst", "cone", "line"].some(shape => method.toLowerCase().includes(shape)),
            macroFilter: (name, descriptor) =>
                /Cone|Burst|Line/.test(name) && name.startsWith(`${descriptor}-`),
            autorecFilter: (label, descriptor) =>
                /Cone|Burst|Line/.test(label) && label.startsWith(`${descriptor}-`)
        });
              //replace all items in methods with words Burst, Cone, Line to lowercase
        methods = methods.map(method => {
            method.display = method.display.replace('Burst', 'burst');
            method.display = method.display.replace('Cone', 'cone');
            method.display = method.display.replace('Line', 'line');
            return method;
        });
        //remove all items with the word project in it
        methods = methods.filter(method => !method.display.includes("project"));
        
        return methods;
    }

    generateScript(sequencerActive) {
        let script="";
        if (this.sourceMode === "autorec") {
            if (sequencerActive) {
                script += `
            .play();
                `;
            }
            script += `
            await window.AutomatedAnimations.playAnimation(selected, { name: '${this.method}', type: "spell" }, {});
            `;
            this.sequencerActive = false;
        } else if (this.method !== "none" && this.method) {
            if (!sequencerActive) {
                script += `
        new Sequence()
            .${this.descriptorSequence.descriptor}()
                `;
                this.sequencerActive = true;
            }
            let method = this.method.replace("descriptor","")
            method = method.charAt(0).toLowerCase() + method.slice(1);
            script += `.${method}()
.play();`;
            this.sequencerActive = true;
        }
        else{
            this.sequencerActive = sequencerActive;
        }
        return script
    }
}
class AreaSequenceView {
    constructor(sequenceRunnerEditor) {
        this.sequenceRunnerEditor = sequenceRunnerEditor;
        this.areaSequence = this.sequenceRunnerEditor.descripterView.descriptorSequence.areaSequence;
    }

    get html() {
        return this.sequenceRunnerEditor.html;
    }

    get chosen() {
        return this.html.find('[name="areaMethod"]:checked').val(); // Get selected area method
    }

    set chosen(chosenAreaMethod) {
        const areaRadio = this.html.find(`#area-${chosenAreaMethod}`);
        areaRadio.prop("checked", true).trigger("change");
        this.areaSequence.method = chosenAreaMethod;
    }

    updateFrom(powerItem) {
        this.areaSequence.updateFrom(powerItem);
        this.chosen = this.areaSequence.method;
    }

    get methods() {
        return this.areaSequence.methods;
    }

    update() {
        const areaMethodsContainer = document.querySelector("#area-methods");
        const sourceModeDropdown = this.html.find("#area-source-mode");

        // Update source mode on dropdown change
        sourceModeDropdown.on("change", (event) => {
            this.areaSequence.setSourceMode(event.target.value);
            this.updateMethods();
        });

        this.updateMethods();
    }

    updateMethods() {
        const areaMethodsContainer = document.querySelector("#area-methods");
        areaMethodsContainer.innerHTML = ""; // Clear existing methods

        const areaMethods = this.methods;

        if (areaMethods.length > 0) {
            areaMethods.forEach(({ original, display }) => {
                areaMethodsContainer.innerHTML += `
                    <div>
                        <input type="radio" id="area-${original}" name="areaMethod" value="${original}">
                        <label for="area-${original}">${display}</label>
                    </div>
                `;
            });

            areaMethodsContainer.innerHTML += `
                <div>
                    <input type="radio" id="area-none" name="areaMethod" value="none" checked>
                    <label for="area-none">None</label>
                </div>
            `;

            this.html.find("input[type='radio'][name='areaMethod']").on("change", async () => {
                this.areaSequence.method = this.chosen;
                this.sequenceRunnerEditor.scriptView.generate();
            });
        } else {
            areaMethodsContainer.innerHTML = `<p>No area methods found for the selected source mode.</p>`;
        }

        this.chosen = this.areaSequence.method;
    }

    get content() {
        return `
            <fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                <legend>Area Methods</legend>
                <label for="area-source-mode">Source:</label>
                <select id="area-source-mode" style="margin-bottom: 10px;">
                    <option value="descriptor">Descriptor</option>
                    <option value="macro">Macro</option>
                    <option value="autorec">AutoRec</option>
                </select>
                <div id="area-methods" style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                    <p>Select an effect to see available methods containing "area"</p>
                </div>
            </fieldset>
        `;
    }
}


class ProjectionSequence extends BaseSequence {
    constructor(descriptorSequence) {
        super(descriptorSequence, "Project"); // Pass methodType as "Project"
        this.method = "project";
    }

    updateFrom(powerItem) {
        const projectMethods = this.methods;

        if (powerItem.range === "Personal") {
            this.method = "none";
            return;
        }

        if (powerItem.areaShape && powerItem.range === "Range") {
            const areaProjectMethod = projectMethods.find(method =>
                method.original.toLowerCase().includes(powerItem.areaShape.toLowerCase())
            );
            if (areaProjectMethod) {
                this.method = areaProjectMethod.original;
                return;
            } else {
                this.method = "project";
                return;
            }
        } else if (powerItem.range === "Range") {
            if (powerItem.effect) {
                const powerProjectMethod = projectMethods.find(method =>
                    method.original.toLowerCase().includes(powerItem.effect.toLowerCase())
                );
                if (powerProjectMethod) {
                    this.method = powerProjectMethod.original;
                    return;
                } else {
                    this.method = "project";
                    return;
                }
            } else {
                this.method = "none";
            }
        }


        this.method = "none";
    }

    generateScript(sequencerActive) {
        let script = "";
        if (this.sourceMode === "autorec") {
            if (sequencerActive) {
                script += `
.play();
                `;
                
            }
            script += `await window.AutomatedAnimations.playAnimation(selected, { name: '${this.method}', type: "spell" }, {});
            `;
            this.sequencerActive = false;
        } else if (this.method !== "none" && this.method) {
            if (!sequencerActive) {
                script += `
new Sequence()
    .${this.descriptorSequence.selectedDescriptor}()
                `;
                this.sequencerActive = true;
            }
            let method = this.method.replace("descriptor", "");
            method = method.charAt(0).toLowerCase() + method.slice(1);
            let target = this.descriptorSequence.affectedByPowerSequence.affectedType
            if(this.descriptorSequence.areaSequence.method && this.descriptorSequence.areaSequence.method!="none")
            {
                target = "template"
            }
            script += `.${method}({ affected: ${target} })
        `;
            this.sequencerActive = true;
        }
        else{
            this.sequencerActive = sequencerActive;
        }
        return script;
    }
}
class ProjectionSequenceView {
    constructor(sequenceRunnerEditor) {
        this.sequenceRunnerEditor = sequenceRunnerEditor;
        this.projectionSequence = this.sequenceRunnerEditor.descripterView.descriptorSequence.projectionSequence;
    }

    get html() {
        return this.sequenceRunnerEditor.html;
    }

    get chosen() {
        return this.html.find('[name="projectMethod"]:checked').val(); // Get the selected project method
    }

    set chosen(projectMethod) {
        const projectRadio = this.html.find(`#project-${projectMethod}`);
        projectRadio.prop("checked", true).trigger("change");
        this.projectionSequence.method = projectMethod;
    }

    updateFrom(powerItem) {
        this.projectionSequence.updateFrom(powerItem);
        this.chosen = this.projectionSequence.method;
    }

    get methods() {
        return this.projectionSequence.methods;
    }

    update() {
        const projectMethodsContainer = document.querySelector("#project-methods");
        const sourceModeDropdown = this.html.find("#project-source-mode");

        // Update source mode on dropdown change
        sourceModeDropdown.on("change", (event) => {
            this.projectionSequence.setSourceMode(event.target.value);
            this.updateMethods();
        });

        this.updateMethods();
    }

    updateMethods() {
        const projectMethodsContainer = document.querySelector("#project-methods");
        projectMethodsContainer.innerHTML = ""; // Clear existing methods

        const projectMethods = this.methods;

        if (projectMethods.length > 0) {
            projectMethods.forEach(({ original, display }) => {
                projectMethodsContainer.innerHTML += `
                    <div>
                        <input type="radio" id="project-${original}" name="projectMethod" value="${original}">
                        <label for="project-${original}">${display}</label>
                    </div>
                `;
            });

            projectMethodsContainer.innerHTML += `
                <div>
                    <input type="radio" id="project-none" name="projectMethod" value="none" checked>
                    <label for="project-none">None</label>
                </div>
            `;

            this.html.find("input[type='radio'][name='projectMethod']").on("change", async () => {
                this.projectionSequence.method = this.chosen;
                await this.sequenceRunnerEditor.scriptView.generate();
            });
        } else {
            projectMethodsContainer.innerHTML = `<p>No methods containing "project" found for this effect.</p>`;
        }

        this.chosen = this.projectionSequence.method;
    }

    get content() {
        return `
            <fieldset>
                <legend>Project Methods</legend>
                <label for="project-source-mode">Source:</label>
                <select id="project-source-mode" style="margin-bottom: 10px;">
                    <option value="descriptor">Descriptor</option>
                    <option value="macro">Macro</option>
                    <option value="autorec">AutoRec</option>
                </select>
                <div id="project-methods" style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                    <p>Select an effect to see available methods containing "project"</p>
                </div>
            </fieldset>
        `;
    }
}



class CastSequence extends BaseSequence{
    constructor(descriptorSequence){
        super(descriptorSequence, "Cast");
        this.descriptorSequence = descriptorSequence;
        this.method = "cast";
    }


    updateFrom(powerItem){
        let castFound = false;
        let castMethods = this.methods;
        if(powerItem.range=="Range"){
            let rangeCastMethods = castMethods.find(method => method.original.toLowerCase().includes("range"));
            if(rangeCastMethods){
                this.method = rangeCastMethods.original;
                castFound = true;
            }
        }
        else
        {
            if(powerItem.range=="Melee"){
                let meleeCastMethods = castMethods.find(method => method.original.toLowerCase().includes("melee"));
                if(meleeCastMethods){
                    this.method = meleeCastMethods.original;
                    castFound = true;
                }
            }
        }
        if(!castFound){ 
            let powerEffectCastMethods = castMethods.find(method => method.original.toLowerCase().includes(powerItem?.effect?.toLowerCase()));
            if(powerEffectCastMethods){
                this.method = powerEffectCastMethods.original;
                castFound = true;
            }
        }
        if(!castFound && powerItem.areaShape){
            let areaCastMethods = castMethods.find(method => method.original.toLowerCase().includes(powerItem.areaShape?.toLowerCase()));
            if(areaCastMethods){
                //first castmethod with area in it set from the value
                this.method = areaCastMethods.original;
                castFound =true
            }
        }
        if(!castFound){
                //if no range or melee cast method is found, set the first cast method
                this.method = "cast";
        }
    }

    generateScript(sequencerActive) {
        let script="";
        if (this.sourceMode === "autorec") {
            if (sequencerActive) {
                script += `
.play();
                `;
            }
            script += `
    await window.AutomatedAnimations.playAnimation(selected, { name: '${this.method}', type: "spell" }, {});
            `;
             this.sequencerActive = false;
        } else {
            if (!sequencerActive) { 
                script += `
new Sequence()
    .${this.descriptorSequence.selectedDescriptor}()`;
                this.sequencerActive = true;
            }
            let method = this.method.replace("descriptor","")
            method = method.charAt(0).toLowerCase() + method.slice(1);
            let target = this.descriptorSequence.affectedByPowerSequence.affectedType
            if(this.descriptorSequence.areaSequence.method && this.descriptorSequence.areaSequence.method!="none")
            {
                target = "template"
            }
            script += `
        .${method ? method : "cast"}({ affected: ${target} ${this.descriptorSequence.powerEffectSequence.hasMovementEffect ? ", position: position" : ""} })
        `;
         this.sequencerActive = true;
        }
        return script;
    }
    
}
class CastSequenceView{
    constructor(sequenceRunnerEditor) {
        this.sequenceRunnerEditor = sequenceRunnerEditor;
        this.castSequence= this.sequenceRunnerEditor.descripterView.descriptorSequence.castSequence;
    }
    get html() {
        return this.sequenceRunnerEditor.html;
    }
    get chosen() { 
        return this.html.find('[name="castMethod"]:checked').val();
    }
    set chosen(castMethod) {
        const castRadio = this.html.find(`#cast-${castMethod}`);
        castRadio.prop("checked", true).trigger("change");
        this.castSequence.method = castMethod;
    }
    updateFrom(powerItem){
        this.castSequence.updateFrom(powerItem);
        this.chosen = this.castSequence.method;
    }
    get methods() {
        return this.castSequence.methods;
    }
    update() {
      
        const castMethodsContainer = document.querySelector("#cast-methods");
        const sourceModeDropdown = this.html.find("#cast-source-mode");

        sourceModeDropdown.on("change", (event) => {
            this.castSequence.setSourceMode(event.target.value);
            this.updateMethods();
        });

        this.updateMethods();
        
    }
    updateMethods() {  
        const castMethodsContainer = document.querySelector("#cast-methods");
        castMethodsContainer.innerHTML = ""; // Clear existing methods

        const castMethods = this.castSequence.methods;
        if (castMethods.length > 0) {
            castMethods.forEach(({ original, display }) => {
                castMethodsContainer.innerHTML += `
                    <div>
                        <input type="radio" id="cast-${original}" name="castMethod" value="${original}">
                        <label for="cast-${original}">${display}</label>
                    </div>
                `;
            });
            this.html.find("input[type='radio'][name='castMethod']").on("change", async () => {
                this.castSequence.method = this.chosen
                await this.sequenceRunnerEditor.scriptView.generate();
            });
        } else {
            castMethodsContainer.innerHTML = `<p>No cast methods found for the selected source mode.</p>`;
        }
         this.chosen = this.castSequence.method;
    }
    get content() {
        return `
            <fieldset>
                <legend>Cast Methods</legend>
                <label for="cast-source-mode">Source:</label>
                <select id="cast-source-mode" style="margin-bottom: 10px;">
                    <option value="descriptor">Descriptor</option>
                    <option value="macro">Macro</option>
                    <option value="autorec">AutoRec</option>
                </select>
                <div id="cast-methods" style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                    <p>Select a cast method</p>
                </div>
            </fieldset>
        `;
    }
}

class DescriptorSequence{
    constructor(powerItem){
        this.powerItem = powerItem;
        this.descriptorClasses = {
            "airEffect":"Air",
         //   "darknessEffect":"Darkness",
            "earthEffect": "Earth",
            "electricityEffect": "Electricity",
         //   "energyEffect": "Energy",
          //  "entropyEffect": "Entropy",
          //  "exoskeletonEffect": "Exoskeleton",
            "fireEffect": "Fire",
        //    "gasEffect": "Gas",
            "holyEffect": "Holy",
            "iceEffect": "Ice",
        //    "impactEffect": "Impact",
            "insectEffect": "Insect",
        //    "invincibleEffect": "Invincible",
        //    "kineticEffect": "Kinetic",
        //    "lightEffect": "Light",
            "lightningEffect": "Lightning",
            "powerEffect": "Power",
        //    "magnetismEffect": "Magnetism",
        //    "loveEffect": "Love",
        //    "magicEffect": "Magic",
        //    "plantEffect": "Plant",
        //    "poisonEffect": "Poison",
        //    "psychicEffect": "Psychic",
            "radiationEffect": "Radiation",
        //    "noDescriptorEffect": "No Descriptor",
        //    "superSpeedEffect": "Super Speed",
            "superStrengthEffect": "Super Strength",
            "waterEffect": "Water",
            "webEffect": "Web",
        };
        if(this.powerItem){
            this.descriptorClass = Sequencer.SectionManager.externalSections[this.powerItem.descriptor.toLowerCase()+"Effect"];
        }
        this.castSequence = new CastSequence(this);
        this.projectionSequence = new ProjectionSequence(this);
        this.areaSequence = new AreaSequence(this);
        this.powerEffectSequence = new PowerEffectSequence(this);
        this.affectedByPowerSequence = new AffectedByPowerSequence(this);
        this.sequencerScript = new SequencerScript(this)
        
        //this.descriptorClass = Sequencer.SectionManager.externalSections[P"powerEffect"];
    }
    get methods() {
        if(this.descriptorClass && this.descriptorClass?.prototype){
            let methods =  Object.getOwnPropertyNames(this.descriptorClass?.prototype).filter(name =>
                typeof this.descriptorClass.prototype[name] === "function"
            );
            return methods;
        }
        return []
    } 

    get summary(){
        let name =  this.descriptorClass.name +"-"+ this.castSequence.method 
        if(this.projectionSequence.method!="none")
        name+="-"+this.projectionSequence.method
        if(this.areaSequence.method!="none")
        name+="-"+this.areaSequence.method
        if(this.powerEffectSequence.selectedEffects){
            for (effect in powerEffectSequence){
                name+="-"+effect
            }
        }
        else {
            name+="-"+ "none"
        }
            
        return name;
    }

    get descriptorName(){
        let descriptor =  this.descriptorClass?.name?.replace(/\b[A-Z]/g, char => char.toLowerCase()).replace("Section","");
        
        return  this.descriptorClasses[descriptor]
    }
    get name(){
        let name = this.descriptorName
        let range
        if(this.projectionSequence.method!="none")
        range="-"+"Range"
        else if(this.powerItem.range=="Melee"){
            range="-"+"Melee"
        }
        else if(this.powerItem.range=="Personal"){
            range="-"+"Personal"
        }
        if(!range){
            range="-"+"Range"
        }
        name+=range
        if(this.areaSequence.method!="none")
        name+="-"+this.areaSequence.method.charAt(0).toUpperCase() + this.areaSequence.method.slice(1);
        if(this.powerEffectSequence.selectedEffectMethods){
    
            for (const effect of this.powerEffectSequence.selectedEffectMethods){
                name+="-"+effect.display
            }
        }
        else {
            name+="-"+ "None"
        }
            
        return name;
        
    }

    set selectedDescriptor(selectedDescriptor) {
        this._selectedDescriptor = selectedDescriptor;
        this.descriptorClass = Sequencer.SectionManager.externalSections[selectedDescriptor];
    }

    get selectedDescriptor() {
        return this._selectedDescriptor;
    }

    updateFromPowerItem(){ 
        //concatentate the descriptor and effect to get the descriptorEffect
        
        let selectedDescriptor = this.powerItem.descriptor.replace(" ","")+"Effect"
        //lower case first letter
        selectedDescriptor = selectedDescriptor.charAt(0).toLowerCase() + selectedDescriptor.slice(1) ;
       
        
        this.selectedDescriptor = selectedDescriptor
        
        this.castSequence.updateFrom(this.powerItem);
        this.projectionSequence.updateFrom(this.powerItem);
        this.areaSequence.updateFrom(this.powerItem);
        this.affectedByPowerSequence.updateFrom(this.powerItem);
        this.powerEffectSequence.updateFrom(this.powerItem);
    }
}
class DescriptorSequenceView{
    constructor(sequenceRunnerEditor) {
        this.sequenceRunnerEditor = sequenceRunnerEditor;
        this.sequenceRunnerEditor.descripterView = this;
        
        this.powerItem = new PowerItem(this.sequenceRunnerEditor.foundryApplication);
        
        this.descriptorSequence = new DescriptorSequence(this.powerItem);
        this.descriptorClasses = this.descriptorSequence.descriptorClasses;

        
        
    
        this.castMethodsView = new CastSequenceView(this.sequenceRunnerEditor);
        this.projectionMethodsView = new ProjectionSequenceView(this.sequenceRunnerEditor);
        this.areaMethodsView = new AreaSequenceView(this.sequenceRunnerEditor);
        this.powerEffectMethodsView = new PowerEffectsSequenceView(this.sequenceRunnerEditor);
        this.affectedByPowerView = new AffectedByPowerSequenceView(this.sequenceRunnerEditor);
    }
    registerOnDescriptorSelected(){
        this.html.find("#descriptor").on("change", async (event) => {
        this.selected = event.target.value
        });
    }

    get html() { 
        return this.sequenceRunnerEditor.html;
    }
    get selected() {
        //let selected = this.descriptorSequence.selectedDescriptor;
        return this.html.find('[name="descriptor"]').val(); // Descriptor
    }
    set selected(selectedDescriptor) {
        //selectedDescriptor = selectedDescriptor.toLowerCase() +"Effect" 
        const effectDropdown = this.html.find("#descriptor");
        effectDropdown.val(selectedDescriptor); 
        if(selectedDescriptor!=this.descriptorSequence.selectedDescriptor){
            this.descriptorSequence.selectedDescriptor = selectedDescriptor;
        }

        this.update()
        return selectedDescriptor;
    }
    
    get content()   
    {
        return `<div>
        <label for="descriptor">Select Effect:</label>
        <select id="descriptor" name="descriptor">
            <option value="" disabled selected>Choose a descriptor</option>
            ${Object.keys(this.descriptorClasses).map(descriptor => `<option value="${descriptor}">${Object(this.descriptorClasses)[descriptor]}</option>`).join("")}
        </select>
    </div>`
        + this.castMethodsView.content
        + this.projectionMethodsView.content
        + this.areaMethodsView.content
        + this.affectedByPowerView.content
        + this.powerEffectMethodsView.content
    }
    update() { 
       // this.selected!=null &&
        if( this.selected !=this.descriptorSequence.selectedDescriptor && this.descriptorSequence.selectedDescriptor!="no descriptorEffect" ){
            this.selected =this.descriptorSequence.selectedDescriptor
        }
        this.castMethodsView.update()
        this.projectionMethodsView.update()
        this.areaMethodsView.update()
        this.affectedByPowerView.update() 
        this.powerEffectMethodsView.update()
    this.sequenceRunnerEditor.scriptView.generate();
    }
    updateFromPowerItem(){
        this.descriptorSequence.updateFromPowerItem();
    }
}
class PowerItem{

    constructor(input=undefined) {
        if(input){
            if(input.document){
            this.item = input.document;
            }
            else
            {
                this.item = input;
            }
        }

    }

    set token(token){
        this._token = token;
        if(this._token.actor && this.attack){
            this.item = this._token.actor.items.get(this.attack.links.pwr) 
        }
        else if( this.attack){
            this.item = this._token.items.get(this.attack.links.pwr)
        }
    }
    get token(){
        return this._token;
    }
    set attack(attack)
    {
        this._attack = attack;
        if(this.token){
        if(this.token.actor){
                this.item = this.token.actor.items.get(this.attack.links.pwr) //why doesnt attaque.pwr work?
            }
            else
            {
                this.item = this.token.items.get(this.attack.links.pwr) //why doesnt attaque.pwr work?
            }
        }
    }
    get attack(){
        return this._attack;
    }
get descriptor(){  
        let item = this.item;
        return item.system.descripteurs["2"] ?item.system.descripteurs["2"]:item.system.descripteurs["1"]?item.system.descripteurs["1"]:item.system.descripteurs["0"]?item.system.descripteurs["0"]:"Power"
}
get effect() {
    let power = this.item;
    let effect = power.system.effetsprincipaux;
    if (effect=="")
    {
        effect = power.name
    }
    effect = effect.replace(/\d+/g, '');
    
    const effects = [  
                    "Affliction", "Alternate Form", "Blast", "Burrowing", "Communication",   
                    "Comprehend", "Concealment", "Create", "Damage", "Dazzle", 
                    "Deflection", "Duplication", "Element Control", "Elongation", 
                    "Energy Absorption", "Energy Aura", "Energy Control", "Enhanced Trait", 
                    "Environment", "Extra Limbs", "Feature", "Flight", "Force Field",
                    "Growth", "Healing", "Illusion", "Immortality", "Immunity", 
                    "Insubstantial", "Invisibility", "Leaping", "Luck Control",
                    "Magic", "Mental Blast", "Mimic", "Mind Control", "Mind Reading",
                    "Morph", "Move Object", "Movement", "Nullify", "Power-LifSensing", 
                    "Senses", "Shapeshift", "Shrinking", "Sleep","Power-Lifting", 
                    "Protection", "Quickness", "Regeneration", "Remote Sensing", "Snare", 
                    "Speed", "Strike", "Suffocation", "Summon", "Super-Speed",
                    "Swimming", "Teleport", "Transform", "Variable", "Weaken", "Leaping", "Swinging", "Running"];
    let matchedEffect = effects.find(effectEntry => effect.includes(effectEntry));
    if(matchedEffect=="Blast"){
        matchedEffect="Damage";
    }
    //if(matchedEffect=="Dazzle")
    //{
        //  matchedEffect = "Affliction"
    //}
   
    return matchedEffect;
} 
get areaShape() {
    let power = this.item;
    for (const key in power.system.extras) {
        const item = power.system.extras[key];
        if (item.name && item.name.includes("Cone")) {
            return "Cone"
        }
        if (item.name && item.name.includes("Line")) {
            return "Line"
        }
        if (item.name && item.name.includes("Burst")) {
            return "Burst"
        }
    }
}
get range() {
    if(this.attack){
            if (this.attack.save.passive.type == 'parade') {
                return  'Melee';
            } else {
                return 'Range';
            }
    }
    for (const key in this.item.system.extras) {
            const extra = this.item.system.extras[key];
            if(extra.name && (extra.name.includes("Range") || extra.name.includes("Ranged")))
            {
                return "Range"
            }
        }
    if(this.item.system.portee=="distance"){
        return "Range"
    }
    if(this.item.system.portee=="perception"){
        return "Range" 
    }
    if(this.item.system.portee=="contact"){
        return "Melee"
    }
    if(this.item.system.portee=="personnelle"){
        return "Personal"
    }
    return "Range";
}
get descriptorName(){
    let area = this.areaShape;
    if(!area)
    {
        return `${this.descriptor}-${this.range}-${this.effect}`;
    }
    return `${this.descriptor}-${this.range}-${area}-${this.effect}`;
    
}

get expandedDescriptorName(){
       return this.descriptor+"-"+this.range + (this.areaShape!=undefined?"-"+this.areaShape:"" )+"-"+this.item.system.effetsprincipaux  
} 
get autoRecEntryLabel(){
        return this.matchingAutoRecEntry?.label
}
get matchingAutoRecEntry(){
        let powerName =this.item.name
        let result = this.findAutoRecEntry(powerName)
        if(result)
        {
            return result
        }
        else{
            powerName = this.descriptor+"-"+this.range + (this.areaShape!=undefined?"-"+this.areaShape:"" )+"-"+this.item.system.effetsprincipaux 
            
            result = this.findAutoRecEntry(powerName)
            if(result){
                return result
            }
            else{
                powerName = this.descriptorName
                result = this.findAutoRecEntry(powerName)
                return result
            }
            
        }
}
    findAutoRecEntry(search){
        const melee =  game.settings.get("autoanimations", "aaAutorec-melee")
        const range =  game.settings.get("autoanimations", "aaAutorec-range")
        const ontoken =   game.settings.get("autoanimations", "aaAutorec-ontoken")
        const preset =   game.settings.get("autoanimations", "aaAutorec-preset")
        const templatefx =   game.settings.get("autoanimations", "aaAutorec-templatefx")
    
        const allEntries = [...melee, ...range, ...ontoken, ...preset, ...templatefx];
        const matchedEntry = allEntries.find(entry => entry.label === search);
        if(matchedEntry){
            return matchedEntry
        }
        return matchedEntry;
}

    get animation(){
        let animation = {}
        if(!this.item){return}
        let macroId = this.item.getFlag('mm3e-animations', 'descriptorMacro')
        if(macroId){
            let macro = game.macros.get(macroId)
            if(macro)
            {
                animation.name  = macro.name;
                animation.type = 'attached';
                animation.play =()=>{
                    macro.execute()
                }
            }
        }
        if(!animation.name){
            let macroName = this.expandedDescriptorName
            let macro = game.macros.find(macro => macro.name === macroName)
            if(!macro){
                let expanded = this.autoRecEntryLabel  //if there is an autorec that matches the expanded name get that first else look for a descriptor macro 
                if(!expanded){
                    macroName = this.descriptorName ;
                     macro = game.macros.find(macro => macro.name === macroName)
                }
            }
            if(macro)
            {
                animation.name = macroName 
                animation.type =  'match';
                animation.play =(source)=>{
                    macro.execute()
                }
            }
        }
        if(!animation.name){
            animation.name = this.autoRecEntryLabel;
            if(animation.name)
            {
                animation.type = "autorec";
                animation.play = (source)=>{
                let options = {};
                let item = {
                    name: animation.name,
                    type: "spell"
                }
                window.AutomatedAnimations.playAnimation(source, item, options);
                }
            } 
        }
        if(!animation.name){
            let descripterSequence = new DescriptorSequence(this)
            descripterSequence.updateFromPowerItem();
            if(descripterSequence.descriptorClass){
                
                animation.name = descripterSequence.name;
                animation.type = "descriptor"
                animation.play = (source)=>{
                    descripterSequence.sequencerScript.generate() 
                    descripterSequence.sequencerScript.run()
                }

            }
        }
        if(!animation.name){
            animation.name = this.descriptorName;
            animation.type = "none"
            animation.play = (source)=>{
                console.log("No power to play for " +  animation.name)
            }
        }
        return animation
        
    }
}


class SequencerScript{
    constructor(descriptorSequence){
        this.descriptorSequence = descriptorSequence;
        this.descriptorSequence.sequencerScript = this
        this.script = "";

    }

    async run() {
        try {
            const asyncWrapper = new Function(`return (async () => { ${this.script} })();`);
            await asyncWrapper();
        } catch (error) {
            console.error("Error executing macro:", error);
            ui.notifications.error(`Error running macro: ${error.message}`);
        }
    }

    get range(){
        let range
        if(this.descriptorSequence.projectionSequence.method && this.descriptorSequence.projectionSequence.method!== "none" ){
            return  "Range";
        }
        else
        {
            if( this.descriptorSequence.affectedByPowerSequence && this.descriptorSequence.affectedByPowerSequence.affectedType == "selected") {
                return  "Personal";
            }
            else
            {
                return "Melee";
            }
        }
    }
    get area(){
        return this.descriptorSequence.areaSequence.method && this.descriptorSequence.areaSequence.method !== "none"
            ? ["cone", "line", "burst"].find(keyword => this.descriptorSequence.areaSequence.method.toLowerCase().includes(keyword.toLowerCase())) || ""
            : "";
    } 

    get powerEffects(){
        return this.descriptorSequence.powerEffectSequence.selectedEffectMethods.length > 0 
            ? this.descriptorSequence.powerEffectSequence.selectedEffectMethods.map(effect => effect.original.replace(/^affect/, "")).join("-") 
            : "None";
    }

    set name(changedName){
        this._changedName = changedName
    }
    get name(){
        if(!this._changedName || this._changedName==""){
            let range = this.range;
            let area = this.area.charAt(0).toUpperCase() + this.area.slice(1);
            let powerEffects = this.powerEffects;
            return  `${this.descriptorSequence.descriptorClasses[this.descriptorSequence.selectedDescriptor]}-${range}${area ? `-${area}` : ""}-${powerEffects}`;
        }
        return this._changedName;
    } 

    get descriptor(){   
        return this.descriptorSequence.selectedDescriptor
    }

    async generate() {  
        
        const powerEffectMethods = this.descriptorSequence.powerEffectSequence.selectedEffectMethods.map(effect => {
            const methodNames = this.descriptorSequence.powerEffectSequence.methods;
            const isMethodInDescriptor = methodNames.some(method => method.original === effect.original);
            if (isMethodInDescriptor) {
                return effect;
            } else {
                return { original: "affectAura", display: "Aura" };
            }
        });
    
        let script = 
`const selected = GameHelper.selected;
const selectedTargets = Array.from(game.user.targets);`;
    
        let sequencerActive = false;
    
        
        if (powerEffectMethods.some(p => p.original.includes("Create"))) {
            script += `
    let create = await GameHelper.placeCreationTile({ power: '${selectedDescriptor}' });
            `;
            this.descriptorSequence.affectedByPowerSequence.affectedType = "create";
            script=script+this.descriptorSequence.castSequence.generateScript(sequencerActive)
            sequencerActive = this.descriptorSequence.castSequence.sequencerActive;  

            script+= this.descriptorSequence.projectionSequence.generateScript(sequencerActive)
            sequencerActive = this.descriptorSequence.projectionSequence.sequencerActive;        
            if (sequencerActive) {
                script += `
    .play();
                `;
            } 
        } else {
            if (this.descriptorSequence.powerEffectSequence.hasMovementEffect) {
                script += `
    let position = await GameHelper.placeEffectTargeter('${this.descriptorSequence.selectedDescriptor}');
                `;
            } 
    
            const areaMethod = this.descriptorSequence.areaSequence.method;
            if (areaMethod && areaMethod!= "none" ) { 
                script += `
await GameHelper.waitForTemplatePlacement(); 
const template = GameHelper.template;
                            `;
            }else{
                if (this.descriptorSequence.affectedByPowerSequence.affectedType === "target") {
                    script += `
for (let target of selectedTargets) {
    `;
                }
            }

            script= script+this.descriptorSequence.castSequence.generateScript(sequencerActive)
            sequencerActive = this.descriptorSequence.castSequence.sequencerActive;

            script+= this.descriptorSequence.projectionSequence.generateScript(sequencerActive)
            sequencerActive = this.descriptorSequence.projectionSequence.sequencerActive;  

            if (areaMethod && areaMethod!= "none" ) {
                script += this.descriptorSequence.areaSequence.generateScript(sequencerActive);
                sequencerActive = this.descriptorSequence.areaSequence.sequencerActive;
                script += `
await GameHelper.sleep(3000)
for (let target of selectedTargets) {
    `;
            }
    
            // Add power effect logic
            powerEffectMethods.forEach(powerEffectMethod => {
                if (this.descriptorSequence.powerEffectSequence.sourceMode === "autorec") {
                    if (sequencerActive) {
                        script += `
.play();
                        `;
                        sequencerActive = false;
                    }
                    script += `
await window.AutomatedAnimations.playAnimation(${whoIsAffected}, { name: '${powerEffectMethod.original}', type: "spell" }, {});
                    `;
                } else {
                    if(this.descriptorSequence.areaSequence.method && this.descriptorSequence.areaSequence.method!="none"){
                        script+=`
   new Sequence()
   .${this.descriptorSequence.selectedDescriptor}()`
                    }
                    script += `.${powerEffectMethod.original}({ affected: ${this.descriptorSequence.affectedByPowerSequence.affectedType} ${this.descriptorSequence.powerEffectSequence.hasMovementEffect ? ", position: position" : ""} })
    `;
                }
            });

            if (powerEffectMethods.length === 0 && sequencerActive) {
                script += `.affectAura({ affected: ${this.descriptorSequence.affectedByPowerSequence.affectedType} })
                `;
            }

            if (sequencerActive) {
                script += `.play();
`;
             
            }

            if (this.descriptorSequence.affectedByPowerSequence.affectedType === "target") {
                script += `}
                `;
            }
        }
    
        this.script = script;
    
        try {
            const asyncWrapper = new Function(`return (async () => { ${script} })();`);
            // await asyncWrapper();
        } catch (error) {
            this.script += `\n\n---------------------------Error executing script---------------------------:
            ${error.message}
            ${error.stack}`;
            console.error("Script Execution Error:", error);
        }
    }
    

    async save(){
        try {
            let macro = game.macros.find(m => m.name === this.name);
            if (!macro) {
                macro = await Macro.create({
                    name: this.name,
                    type: "script",
                    scope: "global",
                    command: this.script,
                });
                ui.notifications.info(`Macro "${this.name}" has been created.`);
            } else {
                let overwrite = await Dialog.confirm({
                    title: "Overwrite Macro",
                    content: `<p>The macro "${this.name}" already exists. Do you want to overwrite it?</p>`,
                    yes: () => true,
                    no: () => false,
                    defaultYes: false
                });
                
                if (!overwrite) {
                    ui.notifications.info(`Macro "${this.name}" was not overwritten.`);
                    return false;
                }
                await macro.update({ command: this.script });  
                ui.notifications.info(`Macro "${this.name}" has been updated.`);
            }

            let item = this.descriptorSequence.powerItem.item;
            await item.setFlag('mm3e-animations', 'descriptorMacro',  macro.id);
        console.log(item)
        } catch (error) {
            ui.notifications.error(`Error saving macro: ${error.message}`);
            console.error("Macro Save Error:", error);
        }

        return false;
    }

    updateFromPowerItem(){
        let item = this.descriptorSequence.powerItem.item;
        let macroName = item.getFlag('mm3e-animations', 'descriptorMacro')
        let macro = game.macros.get(macroName)
        if (macro)
        {
            this.script = macro.command;
            this.name = macro.name;
        }
    }

    get content() {
        return `       
                <fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                    <legend>Output</legend>
                    <input id="macro-name" type="text" style="width: 100%; margin-bottom: 10px;">
                    <textarea id="generated-script" style="width: 100%; height: 300px;"></textarea>
                    <button id="run-macro" type="button" style="margin-top: 10px;">Run Macro</button>
                </fieldset>`
    } 
}
class SequencerScriptView {
    constructor(sequenceRunnerEditor) {
        this.sequenceRunnerEditor = sequenceRunnerEditor;
        this.sequencerScript = this.sequenceRunnerEditor.descripterView.descriptorSequence.sequencerScript;
    }

    get html() {
        return this.sequenceRunnerEditor.html;
    }

    get script() {
        return this.html.find("#generated-script").val(); // Get the generated script
    }

    set script(script) {
        this.html.find("#generated-script").val(script);
        // Update the backend script when script changes
        this.html.find("#generated-script").on("change", async () => {
            this.sequencerScript.script = this.script;
        });
        this.sequencerScript.script = script;
    }

    async run() { 
        this.sequencerScript.run();
    }

    update() {
        this.nameInputElement = document.getElementById('macro-name');
        this.scriptField = document.getElementById('generated-script');
        this.loadButton = document.getElementById('load-macro');
        this.suggestionsElement = document.getElementById('macro-suggestions'); // Added for suggestions list
        this.currentMatches = [];
        this.listenForNameChanges();
        this.registerOnEnter();
        this.registerLoadMacroButtonClick();
    }

    listenForNameChanges() {
        this.nameInputElement.addEventListener('input', async (event) => {
            const inputText = event.target.value;
            this.matches = game.macros.contents.filter(macro =>
                macro.name.toLowerCase().includes(inputText.toLowerCase())
            );
            this.updateMacroSuggestions(this.matches);
            this.loadButton.disabled = this.matches.length === 0;
            this.currentMatches = this.matches;
        });
    }

    registerOnEnter() {
        this.nameInputElement.addEventListener('keydown', (event) => {
            if (event.key === "Enter" && this.currentMatches.length > 0) {
                this.name = this.currentMatches[0].name;
                this.loadButton.disabled = false;
                this.loadMacroContent(this.currentMatches[0]);
            }
        });
    }

    updateMacroSuggestions(matches) {
        const suggestionList = this.suggestionsElement;
        suggestionList.innerHTML = ""; // Clear previous suggestions

        matches.forEach((macro) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = macro.name;

            // Add click behavior to select a macro
            suggestionItem.addEventListener('click', () => {
                this.name = macro.name;
                this.loadButton.disabled = false;
                this.currentMatches = [macro]; // Keep only the selected macro
            });

            suggestionList.appendChild(suggestionItem);
        });
    }

    loadMacroContent(macro) {
        this.script = macro.command;
    }

    registerLoadMacroButtonClick() {
        this.loadButton.addEventListener('click', () => {
            if (this.currentMatches.length > 0) {
                this.loadMacroContent(this.currentMatches[0]);
            }
        });
    }

    set name(name) {
        this.html.find("#macro-name").val(name);
       // this.sequencerScript.name = name;
    }

    get name() {
        return this.sequencerScript.name();
    }

    get range() {
        return this.sequencerScript.range();
    }

    get area() {
        return this.sequencerScript.area();
    }

    get powerEffects() {
        return this.sequencerScript.powerEffects();
    }

    get descriptorView() {
        return this.sequenceRunnerEditor.descripterView;
    } 

    async generate() {
        this.sequencerScript.generate();
        this.script = this.sequencerScript.script;
        this.name = this.sequencerScript.name;
    }

    async save() {
        this.sequencerScript.save();
    }

    updateFromPowerItem() {
        this.sequencerScript.updateFromPowerItem();
        this.script = this.sequencerScript.script;
        this.name = this.sequencerScript.name;
    } 

    get content() {
        return `
           <fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
            <legend>Macro Name</legend>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <input id="macro-name" type="text" style="flex: 1;">
                <button id="load-macro" type="button" style="width: 100px;" disabled>Load Macro</button>
            </div>
            <div id="macro-suggestions" style="border: 1px solid #ddd; max-height: 150px; overflow-y: auto; margin-bottom: 10px;"></div>
            <textarea id="generated-script" style="width: 100%; height: 300px;"></textarea>
            <button id="run-macro" type="button" style="margin-top: 10px;">Run Macro</button>
            <button id="save-macro" type="button" style="margin-top: 10px;">Save Macro</button>
        </fieldset>`
    }

    registerOnSaveClicked() {
        this.html.find("#save-macro").on("click", async () => {
            await this.sequencerScript.save();
        });
    }

    registerOnRunClicked() {
        this.html.find("#run-macro").on("click", async () => {
            await this.sequencerScript.run();
        });
    }

    registerOnNameChanged() {
        this.html.find("#macro-name").on("change", async (event) => {
            this.sequencerScript.name = event.target.value;
        });
    }
}

