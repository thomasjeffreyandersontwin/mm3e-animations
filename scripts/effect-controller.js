
class DescriptorEffectController{
    animateEffect({descriptor, range,area=none, effect}){
          
        const effectSection = getEffectSection(descriptor);
        const castSection = getCastSection(descriptor, range, area);
        const projectSection = getProjectSection( area);
        const affectedSection = getAffectedSection(effect);

        const selectedTargets = Array.from(game.user.targets);
        const selected = GameHelper.selected;
               

        if(area=="none" ){
            for (let target of selectedTargets) {
                descriptorSequence = new Sequence();
                descriptorSequence[castSection]({affected: target});
                if(range=="ranged" || range=="range" || range =="Ranged" || range=="Range")
                {
                    descriptorSequence[projectSection]({affected: target});
                }
                if(range=="melee" || range=="Melee")
                    descriptorSequence[affectedSection]({affected: target})
                else{
                    if(range=="personal" || range=="Personal"){
                        descriptorSequence[affectedSection]({affected: selected})
                    }
                }
                descriptorSequence.play()
            }
        }
        else{
            descriptorSequence = new Sequence();
            descriptorSequence[castSection]({affected: target});
            if(range=="ranged" || range=="range" || range =="Ranged" || range=="Range")
            {
                descriptorSequence[projectSection]({affected: target});
            }
            descriptorSequence[area]({affected: target});

            let sequence = new Sequence()
            for(const target of targets)
            {
                descriptorSequence[affectedSection]({affected: target})
                descriptor.play()
            }
        }   
    }

    getEffectSection(descriptor){
        return descriptor + "effect";
    }

    getCastSection(descriptor, range, area){
        let className = descriptor + "EffectSection";
        let effectMethodName;
        if(area){
            effectMethodName =area.toLowerCase() + "Cast";
        }
        if(!className.hasMethod(effectMethodName)){
            return effectMethodName;
        }
        if(range){
            effectMethodName = range.toLowerCase() + "Cast";
        }

        if(!className.hasMethod(effectMethodName)){
            return effectMethodName;
        }
        return "cast";
    }

    getProjectSection(area){
        let effectMethodName;
        if(area){
            effectMethodName =area.toLowerCase() + "Project";
        }
        if(!className.hasMethod(effectMethodName)){
            return effectMethodName;
        }
        return "project";
    }

    getAffectedSection(effect){
        return "affect" + effect.toUppercase();
    }


}

//c = new DescriptorEffectController();
//c.animateEffect( {descriptor:"Fire", range:"Ranged", effect:"Damage"});
    