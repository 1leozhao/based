// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BaseIDE
 * @dev A smart contract for managing code snippets and projects on Base
 */
contract BaseIDE is Ownable {
    struct Project {
        string name;
        string description;
        address owner;
        uint256 createdAt;
        bool isPublic;
    }

    // Project ID => Project
    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    event ProjectCreated(uint256 indexed projectId, string name, address owner);
    event ProjectUpdated(uint256 indexed projectId, string name);
    event ProjectVisibilityChanged(uint256 indexed projectId, bool isPublic);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Creates a new project
     * @param name Project name
     * @param description Project description
     * @param isPublic Project visibility
     */
    function createProject(
        string memory name,
        string memory description,
        bool isPublic
    ) external returns (uint256) {
        projectCount++;
        
        projects[projectCount] = Project({
            name: name,
            description: description,
            owner: msg.sender,
            createdAt: block.timestamp,
            isPublic: isPublic
        });

        emit ProjectCreated(projectCount, name, msg.sender);
        return projectCount;
    }

    /**
     * @dev Updates project details
     * @param projectId Project ID to update
     * @param name New project name
     * @param description New project description
     */
    function updateProject(
        uint256 projectId,
        string memory name,
        string memory description
    ) external {
        require(projectId <= projectCount, "Project does not exist");
        require(projects[projectId].owner == msg.sender, "Not project owner");

        projects[projectId].name = name;
        projects[projectId].description = description;

        emit ProjectUpdated(projectId, name);
    }

    /**
     * @dev Changes project visibility
     * @param projectId Project ID to update
     * @param isPublic New visibility status
     */
    function setProjectVisibility(uint256 projectId, bool isPublic) external {
        require(projectId <= projectCount, "Project does not exist");
        require(projects[projectId].owner == msg.sender, "Not project owner");

        projects[projectId].isPublic = isPublic;
        emit ProjectVisibilityChanged(projectId, isPublic);
    }

    /**
     * @dev Retrieves project details
     * @param projectId Project ID to query
     */
    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projectId <= projectCount, "Project does not exist");
        Project memory project = projects[projectId];
        require(
            project.isPublic || project.owner == msg.sender,
            "Not authorized to view this project"
        );
        return project;
    }
} 