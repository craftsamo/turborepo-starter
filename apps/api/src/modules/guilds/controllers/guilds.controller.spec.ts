import { Test, TestingModule } from '@nestjs/testing';
import { GuildNotFoundException } from '../../../exceptions';
import { GuildsController } from './guilds.controller';
import { GuildsService } from '../services';
import { CreateGuildDto } from '../dtos';

describe('GuildsController', () => {
  let controller: GuildsController;
  let service: GuildsService;

  const mockGuild = {
    uid: 'test-guild-id',
    name: 'Test Guild',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGuildsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    toAPIGuild: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuildsController],
      providers: [
        {
          provide: GuildsService,
          useValue: mockGuildsService,
        },
      ],
    }).compile();

    controller = module.get<GuildsController>(GuildsController);
    service = module.get<GuildsService>(GuildsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should retrieve all guilds', async () => {
      const guilds = [mockGuild];
      mockGuildsService.findAll.mockResolvedValue(guilds);
      mockGuildsService.toAPIGuild.mockReturnValue(mockGuild);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockGuild]);
    });
  });

  describe('findOne', () => {
    it('should retrieve the guild with the specified UID', async () => {
      mockGuildsService.findOne.mockResolvedValue(mockGuild);
      mockGuildsService.toAPIGuild.mockReturnValue(mockGuild);

      const result = await controller.findOne('test-guild-id');

      expect(service.findOne).toHaveBeenCalledWith({ uid: 'test-guild-id' });
      expect(result).toEqual(mockGuild);
    });

    it('should throw GuildNotFoundException when the guild does not exist', async () => {
      mockGuildsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(GuildNotFoundException);
    });
  });

  describe('create', () => {
    it('should be able to create a new guild', async () => {
      const createGuildDto: CreateGuildDto = {
        uid: 'new-guild-id',
        name: 'New Guild',
      };

      mockGuildsService.create.mockResolvedValue(mockGuild);
      mockGuildsService.toAPIGuild.mockReturnValue(mockGuild);

      const result = await controller.create(createGuildDto);

      expect(service.create).toHaveBeenCalledWith([createGuildDto]);
      expect(result).toEqual(mockGuild);
    });
  });
});
