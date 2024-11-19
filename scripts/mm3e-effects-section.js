Hooks.on("ready", () => { 
    
    class BaseEffectSection extends Sequencer.BaseSection {
    constructor(inSequence) {
        super(inSequence);
        this._effect;
        this.sequence = new Sequence();

        this.tokenAnchor = {
            x: 0, 
            y: 0,
            YdistanceTravelled:0,
            XdistanceTravelled:0,
            
            rotation: 0
        };

        //easy access to tokens
        this.targets = Array.from(game.user.targets);
        this.tiles = canvas.tiles.placeables;
        this.selecteds = canvas.tokens.controlled
        
        this.firstTemplate = canvas.templates.placeables[0];
        this.firstSelected = canvas.tokens.controlled[0];
        this.firstTile = canvas.tiles.placeables[0];
        this.firstTarget = this.targets[0];
        this.firstTargeted = this.targets[0];
        
        
        
        //tokens participating in sequence
        this.caster = this.firstSelected
        this.affected = undefined //this.firstTargeted || this.caster
        
        this._methodLog = [];

    }
    /* static accessors for foundry objects---------------------------------------------- */ 
    static get targets() {
        return Array.from(game.user.targets);
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

    /* commands that need to be overridden for each power --------------------------------------------------------------------------*/
    affectCommon({caster = this.caster || this.firstSelected, affected = this.affected | this.firstTarget}={}){
        if(affected!=0){ //if we passed in a affected
            this.affected = affected
        }
        if(caster!=0){
            this.caster = caster
        }
        
        if(this.affectLocation){
            return this.atLocation(this.affectLocation)
        }
        else{
        return this.mm3eEffect()
        .atLocation(this.affected); 
        }
    }
    affect({caster, affected}={}){
        return this.affectCommon({caster:caster, affected:affected})
    }  

    affectAfflictionCommon({caster, affected}={}){
    }
    affectAffliction({caster, affected}={}){
        this.affectAfflictionCommon({caster:caster, affected:affected})
    }

    coneCommon({caster = this.caster, affected =  this.firstTemplate}={}){
        if(affected!=0){ //if we passed in a affected
            this.affected = affected
        }
        const coneStart = { x: this.affected.data.x, y: this.affected.data.y };
        this.affectLocation = coneStart
        this.mm3eEffect()
            .atLocation(coneStart)
            .stretchTo(this.affected)
        return this 
    }
    cone({caster, affected}={}){
        return this.coneCommon({affected:affected})
    }

    affectDamageCommon({caster, affected}={}){

    }
    affectDamage({caster, affected}={}){
        this.affectDamageCommon({caster:caster, affected:affected})
    }

    lineCommon({affected = this.affected | this.firstTemplate}={}){
        return this.coneCommon({affected:affected})
    }
    line({affected}={}){
        return this.lineCommon({affected:affected})
    }

    burstCommon({affected = this.firstTemplate}={}){
        
        if(!affected==0){
            this.affected = affected
        }
        return this.affectCommon({affected:affected})
    }

    burst({affected}={}){
        return this.burstCommon({affected:affected})
    }

    castCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget), rotation = true}={}){
        if(caster!=0)
            this.caster = caster
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
    cast({caster , affected}={}){
        this.castCommon({caster:caster, affected:affected})
    }

    castToTemplate({caster =(this.caster)}={}){
        return this.cast({caster:caster, affected:this.firstTemplate})
    }

    meleeCastCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}={}){
        return this.castCommon({caster:caster, affected:affected})
    }
    meleeCast({caster , affected}={}){
        return this.meleeCastCommon({caster:caster, affected:affected})
    }

    projectCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}={}){
        this.castCommon({caster:caster, affected:affected})
        let stretchToLocation=affected;
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
    project({caster , affected}={}){
        this.projectCommon({caster:caster, affected:affected})
    }

    projectToConeCommon({caster = (this.caster || this.firstSelected), affected = ( this.firstTemplate || this.affected)}={}){
        this.castCommon({caster:caster, affected:affected})
        const coneStart = { x: this.affected.data.x, y: this.affected.data.y };
        this.stretchTo(coneStart)
        this.affectLocation = coneStart
        return this;
    }
        
    projectToCone({caster , affected}={}){
        return this.projectToConeCommon({caster:caster, affected:affected})
    }

    projectToLine({caster , affected}={}){
        return this.projectToConeCommon({caster:caster, affected:affected})
    }
    
    
    /*methods for addtl functionality --------------------------------------------------------------------------*/

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


    tokenAnimation(token= this.selected){
        this.effected = token;
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animation()//.on(token).opacity(0);
        return this;
    }

    hideToken(token = this.selected)
    {
        this._effect =  this._effect ? this._effect : this.effect();
        this._effect.animation().on(token).opacity(0)
        return this
    }

    showToken(token = this.selected)
    {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animation().on(token).opacity(1)
        return this
    }
    calculateFrontAndCenterPos(affected, distance = 0.25)
    {
        this.targetCenter = {
            x: affected.x+canvas.grid.size*affected.document.width/2,
            y: affected.y+canvas.grid.size*affected.document.width/2,
            };
            
        this.tokenCenter = {
        x: this.caster.x+canvas.grid.size*affected.document.width/2,
        y: this.caster.y+canvas.grid.size*affected.document.width/2,
        };
        
        this.middleposition = {
            x: (this.affected.x - this.caster.x)*distance,
            y: (this.affected.y - this.caster.y)* distance,
        };
    }

    lungeTowardTarget({affected = (this.affected||this.firstTarget), scale =1, distance =.25, duration= 100, repeats=1}={}){
        this.calculateFrontAndCenterPos(affected, distance)
        
        this._effect = this._effect ? this._effect : this.effect();   
        this._effect.animation()
            .on(this.caster)
            .opacity(0)
            // .wait(1)
            

                
    this._effect.effect()
        .from(this.caster)
        .atLocation(this.caster)
        .mirrorX(this.caster.document.data.mirrorX)
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
        this.calculateFrontAndCenterPos(affected,distance)
        
        this._effect = this._effect ? this._effect : this.effect();

        this._effect.animation()
            .on(affected)
            .opacity(0)
            
        .effect()
            .from(affected)
            .atLocation(affected)
            .mirrorX(affected.document.data.mirrorX)
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
    startMovement(token=this.affected) {
        this.tokenAnchor = {
            x: token.document.x,
            y: token.document.y,
            YdistanceTravelled:0,
            XdistanceTravelled:0,
            rotation: token.document.rotation
        }
        this.moving = true;
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.effect().animation().on(token).opacity(0)
        return this;
    }

    endMovement(token=this.affected) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.thenDo( () => {
            token.document.update({
                rotation: token.document.rotation + this.tokenAnchor.rotation
            });
        }
        )

        this._effect.effect().animation().on(token).teleportTo({
            x: this.tokenAnchor.x,
            y: this.tokenAnchor.y
        }).opacity(1)
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
        this._effect.from(this.effected)
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

    scaleOut(inDuration) {
        this.logMethodCall('scaleOut', inDuration);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.scaleOut(inDuration);
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
        

        affectAffliction({affected = this.affected}={}){
            return this.affectCommon({affected:affected})
            .file('jb2a.condition.curse')
            .scaleToObject(2)
            .persist(true)
            .playSound('modules/mm3e-animations/sounds/Spells/Debuff/spell-*.mp3')
        }

        static async placeCreationTile({animation='animated-spell-effects-cartoon.energy.01', tint="#745002"}={}){
            let creationTile = await GameHelper.placeCreationTile({power: this.getClass().getName(), animation:animation, tint:tint, height:300, width:300}) 
        }

        //this doesnt matter
        /*
        affectDamage({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
        }*/

        async affectConcealment({affected = (this.affected|this.firstSelected),filter= GameHelper.whiteColorFilter}= {}){
                
            this.affectCommon({affected:affected})
                .scaleToObject(1.5)
                .file("jb2a.shimmer.01.blue")
                .filter(filter.filterType, filter.values)
                .thenDo(async ()=>{
                    this.affected.document.update({ "alpha": 0.1 });
                })
                this.playSound('modules/mm3e-animations/sounds/action/powers/invisible1.ogg')
            return this;
        }



        affectDamage({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .file('animated-spell-effects-cartoon.energy.flash')
            .scaleToObject(1)
            .playSound('modules/mm3e-animations/sounds/Combat/Melee%20Natural/melee-hit-1.mp3')
        }


        affectHealing({affected = this.firstSelected}={})
        {
            this.affectCommon({affected:affected})
            .file('jb2a.healing_generic.200px.yellow02')
            .playSound('modules/mm3e-animations/sounds/Spells/Buff/spell-buff-long-3.mp3')
            return this;
        }


        affectIllusion({affected = this.affected}={})
        {
            this.affectCommon({affected:affected})
                .file('jb2a.markers.stun.dark_teal.02')
                .filter("ColorMatrix", { saturate: 0, brightness:.5 , hue: 200  })
                .scaleToObject(1)
                .spriteOffset({x:0, y:-25})
                .belowTokens(true)
                .persist(true)
                .playSound('modules/mm3e-animations/sounds/action/powers/Seers_AuraVoicesL_Loop.ogg')
            return this;
        }

        affectMindControl({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .file("jaamod.spells_effects.confusion")
            .scaleToObject(.5)
            .spriteOffset({x:0, y:-30})
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
        }

        affectNullify({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .file("jb2a.condition.curse.01.012")
            .playSound('modules/mm3e-animations/sounds/Spells/Debuff/spell-decrescendo-short-1.mp3')
           
        }

        affectProtection({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .file("jb2a.shield")
            .persist( true)
            .playSound('modules/mm3e-animations/sounds/action/powers/ForcefieldOn.ogg')
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/ForceField*_loop.ogg')
        }

        static async placeSummonedActor({actor }={}){
            let creationTile = await GameHelper.placeSummonedActor({actor}) 
        }

        /* unecessary
        affectSummon({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
        }*/

        affectTransform({affected = this.affected, image=this.getClass().getName()+'.webm'}={})
        {
             this.affectCommon({affected:affected})
             //update the token image
             this.affected.document.update({ "img": image });
             return this;
        }


        affectWeaken({affected = (this.affected|this.firstSelected)}={}){
            let tintColor = '#808080'
            let hue = 350
            if(affected!=0){
                this.affected =affected
            }

            this.calculateFrontAndCenterPos(this.affected, this.affected.document.width/2)
            this.affectCommon({affected:this.affected})
                .from(this.affected)
                .attachTo(this.affected)
                .filter("ColorMatrix", { saturate:-1})
                .scaleToObject(1, {considerTokenScale: true})
                .persist()
                .fadeIn(3000)
            //  .fadeOut(1000)
            //  .duration(5000)

            
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

        startFly({caster}={}){
            this.castCommon({caster:caster, affected:caster})
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
                return this
        }
        
        endFly({caster:caster}={}){
             this.castCommon({caster:caster, affected:caster})
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
            return this;
        }

         //put into macro -->let position= GameHelper.placeEffectTargeter(); then do speed, burrow, or leap
        leap({token = this.affected, position, height=1.25}={}){
            if(!position){
                throw new Error("Position is required for leap")
            }
            this.hideToken(token)
            //.loopUp({distance:[50,0,50], duration:500, duration: 500, delay:0, pause:false})
            .loopProperty("sprite", "position.y", { values: [50, 0, 50], duration: 500})
            .loopScaleHeight({from:1,to:height, duration: 500, pingPong: true, delay:0})
            .loopScaleWidth({from:1,to:height, duration: 500, pingPong: true, delay:0})
            .moveTowards(position, {rotate:false})
            .anchor({ x: 0.5, y: 1.5 })
            .zIndex(2)
    
        .mm3eEffect()
            .from(token)
            .opacity(0.5)
            .scale(0.9)
            .belowTokens()
            .duration(1000)
            .anchor({ x: 0.5, y: 0.5 })
            .filter("ColorMatrix", { brightness: -1 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .moveTowards(position, {rotate:false})
            .zIndex(2)
            .waitUntilFinished()
    
        .teleportTo(position)
        .snapToGrid()
        .waitUntilFinished()
        .showToken(token)
        
        return this
        }

       
        speed({caster, position}={}){
            if(!position){
                throw new Error("Position is required for speed")
            }
            this.castCommon({caster:caster, affected:caster})
                .animation()
                .on(this.caster)
                .fadeOut(500)
                .waitUntilFinished(-150)
            this.castCommon()
                .file("animated-spell-effects-cartoon.air.puff.01")
                .tint("#1c1c1c")
                .scaleToObject(4)
                .waitUntilFinished(-2000)

            .animation()
                .on(this.caster)
                .teleportTo(position)
                .snapToGrid()
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(-1400)
            this.castCommon()
                .file("animated-spell-effects-cartoon.smoke.99")
                .tint("#1c1c1c")
                .filter("ColorMatrix", {brightness: 1, contrast: 1.5})
                .spriteOffset({ x: -3, y: -1 }, { gridUnits: true })
                .atLocation(position)
                .rotateTowards(this.caster)
                .rotate(90)
                .scaleToObject(5, {considerTokenScale: true})
                .waitUntilFinished(-1500)
        
            .animation()
                .on(this.caster)
                .fadeIn(100)
                .waitUntilFinished()



        }

        burrow({caster, position}={}){
           if(!position){
                throw new Error("Position is required for burrow")
            }

            super.castCommon({caster:caster, affected:caster})
                .delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.5)
                .duration(2000)
            
                .pause(800)
            
            super.castCommon()
                .file("jb2a.explosion.04.orange")

                .fadeOut(5000)
                .anchor({x:0.2})
                .scaleToObject(2)
                .duration(1000)
                .rotateTowards(position, { cacheLocation: true })
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                .zIndex(3)
            
            this.castCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .anchor({x: 0.1})
                .atLocation(this.caster, {cacheLocation: true})
                .rotateTowards(position, {cacheLocation: true})
                .scaleToObject(2)
                .belowTokens()
                .opacity(1)
            
            this.castCommon()
                .file("-Assets/Images/Effects/CrackedEarthWEBP.webp")
                .belowTokens()
                .anchor({x: -0.2})
                .size(2, { gridUnits: true })
                .atLocation(token, { cacheLocation: true })
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
            
            this.castCommon()
                .file("blfx.spell.template.line.crack1")
                .stretchTo(position)
                .delay(200)
                .zIndex(5)
            
                .pause(500)
            
            this.castCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .atLocation(this.caster, {offset: {y: -0}, gridUnits: true})
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            
                .pause(100)
            
            this.castCommon()
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
            
            this.castCommon()
                .file("jb2a.particles.outward.orange.01.03")
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(4)
                .duration(10000)
            
            .animation()
                .on(this.caster)
                .teleportTo(position)
                .delay(1000)
                .snapToGrid()
                .fadeOut(50)
                .fadeIn(50)
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(100)
                
                .pause(1000)
            
            
            this.castCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .atLocation(this.caster, {offset: {y: -0}, gridUnits: true})
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
                
                .pause(100)
            
            this.castCommon()
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
            
            .animation()
                .delay(1000)
                .on(this.caster)
                .fadeIn(200)
                .pause(500)
            
            this.castCommon()
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
            
            this.castCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .atLocation(position)
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)
            return this
        }

        swing({caster:caste,positin}={}){
            if(!caster){
                throw new Error("Caster is required for swing")
            }
        }

        teleport({caster:caster, position}={}){
            if(!position){
                throw new Error("Position is required for teleport")
            }
            super.castCommon({caster:caster, affected:caster})
                .file("jb2a.misty_step.01.orange")
                .scaleToObject(1.5)
            .filter("ColorMatrix", { hue: hue })
            .opacity(0.8)

            .animation()
                .on(this.caster)
                .teleportTo(position)
                .snapToGrid()
                .fadeOut(50)
                .fadeIn(50)
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(100)

            super.castCommon()
                .file(`jb2a.swirling_leaves.complete.02.${leaves}`)
                .scaleToObject(2.25)
                .fadeOut(300)
                .filter("ColorMatrix", { saturate: saturate })
                .animateProperty("sprite", "width", { from: token.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "height", { from: token.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "width", { from: 0, to: token.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .animateProperty("sprite", "height", { from: 0, to: token.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .playbackRate(2)
                .belowTokens()
                .tint(tint)

            .pause(1000)

            super.castCommon()
                .file("jb2a.misty_step.02.orange")
                .atLocation(token)
                .filter("ColorMatrix", { hue: hue })
                .opacity(0.8)
                .scaleToObject(1.5)

            .animation()
                .delay(1400)
                .on(token)
                .fadeIn(200)
                .waitUntilFinished(-750)

            super.castCommon()
                .file("jb2a.ground_cracks.orange.01")
                .atLocation(token)
                .opacity(0.9)
                .scaleToObject(3)
                .duration(3000)
                .fadeIn(100)
                .fadeOut(1000)
                .belowTokens()

            super.castCommon()
                .file("jb2a.impact.ground_crack.still_frame.01")
                .atLocation(token)
                .opacity(0.9)
                .scaleToObject(3)
                .duration(4000)
                .fadeIn(100)
                .fadeOut(1000)
                .belowTokens()
        }
    }

    class InsectEffectSection extends PowerEffectSection {
        cast({caster, affected , duration = 1}={}){ 
            super.castCommon({caster:caster, affected:affected})
                .file("jaamod.assets.flies")
                .scaleToObject( .6 )
                .repeats(30)
                .playSound("modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Attack_01.ogg")
                .pause(duration)
             .filter("ColorMatrix", {hue: 520,brightness: 0,contrast:0, saturate:0} )  
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
                .lungeTowardTarget({affected:affected, distance : .5, duration:100, repeats:repeats})  
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
               .mirrorY()
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

 
    class TemplatedDescriptorEffect extends PowerEffectSection{
        
        cast({caster, affected}={}){
            super.castCommon({caster:caster, affected:affected})
            this.descriptorCast()
            return this
        }

        meleeCast({caster, affected}={}){
            super.meleeCastCommon({caster:caster, affected:affected})
            this.descriptorMeleeCast()
            return this
        }

        project({caster, target}={}){
            super.projectCommon({caster:caster, target:target})
            this.descriptorProject()
            return this
        }
        projectToCone({caster, affected}={}){
            super.projectToConeCommon()
            this.descriptorProjectToConeCommon()
            return this
        }  

        projectToLine({caster, affected}={}){
            super.projectToLineCommon()
            this.descriptorProjectToLineCommon()
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
        }

        affect({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorAffect()
            return this;
        }

        affectAura({affected = this.affected|| this.firstSelected}={}){
            super.affectCommon({affected:affected})
            .pause(1000)
            this.descriptorAffectAura()
            return this
        }

        affectAffliction({affected}={}){
            this.affect({affected:affected})
            super.affectAffliction({affected:this.affected})
            return this
        }
        affectCreate({affected}={}){
            this.affect({affected:affected})
            super.affectCreate({affected:this.affected})
            return this
        }


        affectConcealment({affected}={})
        {
            this.affectAura({affected:affected, persist:true})
            super.affectConcealment({affected:this.affected})
            return this;
        }

        affectDamage({affected}={}){
            this.affect({affected:affected})
            super.affectDamage({affected:this.affected})
            return this
        }

        affectHealing({affected}={}){
            this.affectAura({affected:affected, persist:true})
            super.affectHealing({affected:this.affected})
            return this
        }
        
        affectIllusion({affected}={}){
            this.affect({affected:affected})
            super.affectIllusion({affected:this.affected})
            return this
        }

        affectMindControl({affected}={}){
            this.affect({affected:affected})
            super.affectMindControl({affected:this.affected})
            return this
        }
        // descriptor-ranged-move object
        affectMoveObject({affected}={}){
            this.affect({affected:affected})
            super.affectMoveObject({affected:this.affected})
            return this
        }
       
        affectNullify({affected}={}){
            this.affect({affected:affected})
            super.affectNullify({affected:this.affected})
            return this
        }

        affectProtection({affected}={}){
            this.affectAura({affected:affected})
            super.affectProtection({affected:this.affected})
            return this
        }

        affectSummon({affected}={}){
            this.affect({affected:affected})
            super.affectSummon({affected:this.affected})       
            return this
        }

        affectTransform({affected}={}){
            this.affect({affected:affected})
            super.affectTransform({affected:this.affected})
            return this
        }

        affectWeaken({affected}={}){
            this.affect({affected:affected})
            super.affectWeaken({affected:this.affected})
            return this
        }

     

        // descriptor-personal-burrowing
        startFly({caster}={}){
            this.cast({caster:caster})
            super.startFly({caster:this.caster})
            
            return this
        }
        
        endFly({caster}={}){
            this.cast({caster:caster})
            super.endFly({caster:this.caster})
            return this;
        }

        leaping({caster, position, height}={}){
            this.cast({caster:caster})
            super.leap({caster:this.caster, position:position, height:height})
            this.affect({affected:this.caster})
            return this
        }

        speed({caster}={}){
            this.cast({caster:caster})
            super.speed({caster:this.caster})
            this.affectAura({affected:this.caster})
            return this
        }

        burrowing({caster}={}){
            this.cast({caster:caster})
            super.burrow({caster:this.caster})
            this.affectAura({affected:this.caster})

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

    class NoDescriptorEffectSection extends TemplatedDescriptorEffect {
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


     class SuperSpeedEffectSection extends TemplatedDescriptorEffect {
        descriptorCast(){
             this.vibrate()
            .castCommon()
                .file('jb2a.flurry_of_blows.no_hit.yellow')
                .filter("ColorMatrix", { hue: 100,saturation: 0, brightness:1.3})
                .from(this.caster)
                .scale(2.5)
                .spriteOffset({x:-50, y: 0})
                .atLocation(this.caster)
                .repeats(6,500)
            .castCommon() 
                 .playSound('modules/mm3e-animations/sounds/action/powers/Flurry.ogg')  
                .pause(2500)
            .castCommon()
                .file('animated-spell-effects-cartoon.simple.63')
                .scale(.5)
            
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

        runThroughBurstTemplate( points) { 
        
            const token = this.caster; 
            if (!token) {
                console.error("No token selected.");
                return;
            }
        
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
            
            this.effect()
                .animation()
                .opacity(0)
                .on(token)
                .duration(0);
                
            for (let i = 0; i < reorganizedPoints.length-1; i++) {
                this.effect()
                    .file(token.document.texture.src) 
                    .scale(token.document.texture.scaleX) 
                    .opacity(1) 
                    .from(token)
                    .atLocation(reorganizedPoints[i])
            
                    .moveTowards(reorganizedPoints[i+1], { ease: "easeInOutCubic", rotate: true })
                    .duration(500) 
                    .wait(200)
                    
                .effect()
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
                .effect()
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
                .effect()
                        .file("animated-spell-effects-cartoon.simple.29")
                        .atLocation(reorganizedPoints[i])
                        .rotateTowards(reorganizedPoints[i+1])
                        .scale(0.5 * token.document.texture.scaleX)
                        .belowTokens()
                        .opacity(0.85)
                        .scaleIn(0, 300, { ease: "easeOutExpo" })
                        .spriteRotation(-90)
                        .spriteOffset({ x: -3, y: -0.1 }, { gridUnits: true })
                .effect()
                    .delay(100)
                    .file("animated-spell-effects-cartoon.simple.05")
                    .filter("Glow", { color: 0x29c9ff })
                    .spriteOffset({x: 0.5, y: 0.5}, {gridUnits:true})
                    .randomRotation()
                    .scale(.3)
                    .atLocation(reorganizedPoints[i])   
                .sound('modules/mm3e-animations/sounds/power/super%20speed/move%20quick.ogg')
            }
            
            this.effect()
                .animation()
                .opacity(0)
                .on(token)
                .duration(0)
            .effect()
                .animation()
                .opacity(1)
                .on(token)
                .duration(0);
        }

         vibrate()
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
         
        descriptorMeleeCast(){
            let filter =GameHelper.GreyTransparentFilter
            this.vibrate()
            .castCommon()
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
            
            return this
        }

        affectDamage({affected}={}){
             super.affectDamage({affected:affected})
             this.caster = this.affected
             this.vibrate()
            return this
         }

          affectAffliction({affected}={}){
             super.affectAffliction({affected:affected})
             this.caster = this.affected
             this.vibrate()
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
            let points = this.getCircularTemplatePoints(this.affected)
            this.vibrate()
            this.runThroughBurstTemplate(points)
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
           this.playSound('modules/mm3e-animations/sounds/power/super%20speed/wiff.ogg')
            .castCommon()
               .file('animated-spell-effects-cartoon.simple.117')
               .scale(.5)
           .castCommon()
               .from(this.affected)
               .fadeIn(200)
               .fadeOut(500)
               .loopProperty("sprite", "position.x", { from: -0.10, to: 0.10, duration: 50, pingPong: true, gridUnits: true})
               .scaleToObject(this.affected.document.texture.scaleX)
                .persist()
               .playSound('modules/mm3e-animations/sounds/power/super%20speed/vibration%20long.ogg')
               .opacity(0.25)
            return this;
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
  
    class SuperStrengthSection extends PowerEffectSection {
        castSlam({caster}={}){
                super.castCommon({caster:caster, affected:caster}) 
                let fs = new FlightEffect(this);
                fs.start({caster:this.caster})
                fs.end({caster:this.caster})
            return this
        }

        meleeCast({caster, affected, repeats=1}={} ){
            super.meleeCastCommon({caster:caster, affected:affected})
            .file("jb2a.melee_attack.02.trail") 
            .scale(this.caster.document.width*.26, {gridUnits:true})
            .spriteOffset({x:-0.7*this.caster.document.width},{gridUnits:true})
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
                .file("jb2a.melee_generic.slash.01.orange").spriteOffset({x:-20, y:-10})
                .scaleToObject(1.5)
                .zIndex(1)
                .filter("ColorMatrix", {
                    hue: 0, 
                    contrast: 1, 
                    saturate: 0, 
                    brightness: 3 
                })        
            .repeatEffect()
                .mirrorY()
                .pause(400)
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
        
              //  .spriteOffset({x:-190,y:0})
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
            const coneStart = { x: this.affected.data.x, y: this.affected.data.y };
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

    Sequencer.SectionManager.registerSection("myModule", "mm3eEffect", BaseEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "powerEffect", PowerEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "insectEffect", InsectEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "superStrengthEffect", SuperStrengthSection)
    Sequencer.SectionManager.registerSection("myModule", "noDescriptorEffect", NoDescriptorEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "superSpeedEffect",SuperSpeedEffectSection)
    

});

class GameHelper{ 
  
    //make static getters for the selected token and the target token
    static get selected(){
        return canvas.tokens.controlled[0];
    }

    static get targeted(){
        return Array.from(game.user.targets)[0];
    }

   static get target(){
        return Array.from(game.user.targets)[0];
    }

    //make static getters for the all selected tokens and the all target tokens
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

        let config = {
            size: 1,
            icon: icon,
            label: label,
            drawIcon: true,
            drawOutline: true,
            interval: 1 % 2 === 0 ? 1 : -1,
        }
        let position =   await warpgate.crosshairs.show(config);
        return position
    }

    static get targets(){
        return Array.from(game.user.targets);
    }

     static get template(){
        return canvas.templates.placeables[0];
     }

     static async  sleep (ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    } 

    static async placeSummonedActor({actor}={}){
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

    static async placeEffectTargeter (){
        let position = await GameHelper.targetWithCrossHair({icon:'modules/mm3e-animations/power-icons/' + power +'.webp', label:power})
        return position;
    }


    static async placeCreationTile({power, animation, tint, width=150, height=150}={}){
        let position = await GameHelper.targetWithCrossHair({icon:'modules/mm3e-animations/power-icons/' + power +'.webp', label:power})
        const swingPointAnimation =Sequencer.Database.getEntry(animation).originalData
        const tileData = {
            img: swingPointAnimation, 
            x: position.x-width/2,  
            y: position.y-height/2,
            width: width,
            height: height,
            flags: {
                tag: this.name 
            },
        };
        const [tile] = await canvas.scene.createEmbeddedDocuments("Tile", [tileData]);
        await tile.update({"texture.tint":tint})
        return tile
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
}