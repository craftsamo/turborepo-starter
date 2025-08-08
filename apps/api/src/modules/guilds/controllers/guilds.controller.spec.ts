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
    createOne: jest.fn(),
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
    it('全てのギルドを取得できること', async () => {
      const guilds = [mockGuild];
      mockGuildsService.findAll.mockResolvedValue(guilds);
      mockGuildsService.toAPIGuild.mockReturnValue(mockGuild);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockGuild]);
    });
  });

  describe('findOne', () => {
    it('指定されたUIDのギルドを取得できること', async () => {
      mockGuildsService.findOne.mockResolvedValue(mockGuild);
      mockGuildsService.toAPIGuild.mockReturnValue(mockGuild);

      const result = await controller.findOne('test-guild-id');

      expect(service.findOne).toHaveBeenCalledWith({ uid: 'test-guild-id' });
      expect(result).toEqual(mockGuild);
    });

    it('ギルドが存在しない場合にGuildNotFoundExceptionを投げること', async () => {
      mockGuildsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(GuildNotFoundException);
    });
  });

  describe('create', () => {
    it('新しいギルドを作成できること', async () => {
      const createGuildDto: CreateGuildDto = {
        uid: 'new-guild-id',
        name: 'New Guild',
      };

      mockGuildsService.createOne.mockResolvedValue(mockGuild);
      mockGuildsService.toAPIGuild.mockReturnValue(mockGuild);

      const result = await controller.create(createGuildDto);

      expect(service.createOne).toHaveBeenCalledWith(createGuildDto);
      expect(result).toEqual(mockGuild);
    });
  });
});
