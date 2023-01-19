import { Injectable } from '@nestjs/common';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common/exceptions';
import { InjectModel } from '@nestjs/mongoose/dist';
import { Model, isValidObjectId } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel:Model<Pokemon>
  ){

  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return createPokemonDto;
    } catch (error) {
      this.handleException(error);
    }
  }

  findAll() {
    return this.pokemonModel.find();
  }

  async findOne(term: string) {
    let pokemon: Pokemon;
    if(!isNaN(+term)){
      pokemon = await this.pokemonModel.findOne({no:term}).select('-__v');
    } 

    if (!pokemon && isValidObjectId(term) ){
      pokemon = await this.pokemonModel.findById(term);
    }

    if( !pokemon ){
      pokemon = await this.pokemonModel.findOne({name:term.toLocaleLowerCase()})
    }

    if (!pokemon) throw new NotFoundException(`Pokemon with term, name or no "${term}" not found`);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    if ( !pokemon ) throw new NotFoundException(`Pokemon not found`);
    if( updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
      try {
        
        await pokemon.updateOne(updatePokemonDto);
        return {...pokemon.toJSON(),...updatePokemonDto};
      } catch (error) {
        this.handleException(error);
      }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne();
    const {deletedCount}=await this.pokemonModel.deleteOne({_id:id});
    if(deletedCount === 0) throw new BadRequestException(`Pokemon with id ${id} not found`);
    return;
  }

  private handleException( error:any ){
    if( error.code === 11000){
      throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`)
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
