import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseIDE } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BaseIDE", function () {
  let baseIDE: BaseIDE;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    const BaseIDE = await ethers.getContractFactory("BaseIDE");
    baseIDE = await BaseIDE.deploy();
  });

  describe("Project Management", function () {
    it("Should create a new project", async function () {
      const tx = await baseIDE.createProject("Test Project", "A test project", true);
      await tx.wait();

      const projectCount = await baseIDE.projectCount();
      expect(projectCount).to.equal(1);

      const project = await baseIDE.getProject(1);
      expect(project.name).to.equal("Test Project");
      expect(project.description).to.equal("A test project");
      expect(project.owner).to.equal(owner.address);
      expect(project.isPublic).to.be.true;
    });

    it("Should update project details", async function () {
      await baseIDE.createProject("Test Project", "A test project", true);
      
      await baseIDE.updateProject(1, "Updated Project", "Updated description");
      
      const project = await baseIDE.getProject(1);
      expect(project.name).to.equal("Updated Project");
      expect(project.description).to.equal("Updated description");
    });

    it("Should change project visibility", async function () {
      await baseIDE.createProject("Test Project", "A test project", true);
      
      await baseIDE.setProjectVisibility(1, false);
      
      const project = await baseIDE.getProject(1);
      expect(project.isPublic).to.be.false;
    });

    it("Should not allow unauthorized access to private projects", async function () {
      await baseIDE.createProject("Private Project", "A private project", false);
      
      await expect(
        baseIDE.connect(user).getProject(1)
      ).to.be.revertedWith("Not authorized to view this project");
    });
  });
}); 