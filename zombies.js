
<HTML>
<HEAD>
<TITLE>Walking Dead Game</TITLE>
<style>
table
{
	background-color:#D4F1FF;
}

div
{
	background-color:#00CC99;
}
</style>

<SCRIPT>

	var DebugStatus = 0;
	var MaxHealth = new Number (100);
	var PlayerArmor = new Number (0);
	
	var InfectionThreshold = new Number (30);	// 5% chance per point beyond 30
	var InfectionCrossOver = new Number (InfectionThreshold + 20);	// 100%
	var InfectionRatio = new Number (0.5);		// 35% of damage contributes to infection status
	
	var BaseTargetNumber = 75;  // Roll 75+ on D100
	
	var ToggledVisibility = 0;
	
	var GameOver = 0;
	
	var NoItemThere = "nothing";
	
	var Left_C = new Number (0);
	var Right_C = new Number (10);
	var Low_R = new Number (0);
	var High_R = new Number (10);
	var Center_C = new Number (5);
	var Center_R = new Number (5);

	var Loc_R = new Number (5);
	var Loc_C = new Number (5);
	var PlayerCell = "R5C5";
	
	var ThreatStatus = 0;
	var GroundItem = NoItemThere;
	var MessageCount = 0;
	
	var AmmoItems = new Array ("Bullets","AmmoCase1","AmmoCase2");
	var MedicalItems = new Array ("FirstAidKit","MedPack","SafetyBox","Medical1");
	var FoodItems = new Array ("Food","Hamburger","Apple");
	var SupplyItems = new Array ("Supplies","Satchel","Pallets");
	var SpecialItems = new Array ("Binoculars","Journal","Woods","Horde","ZombieArm");
	
	var Bows = new Array ("Crossbow","HuntingBow");
	var Guns = new Array ("Pistol","AutoRifle");
	var Rifles = new Array ("AutoRifle");
	var Pistols = new Array ("Pistol");
	var MeleeWeapons = new Array ("KitchenKnife","CombatKnife","LeadPipe","Crowbar");

	var ArmorItems = new Array ("Kevlar","LeatherJacket","RiotGear");
	
	var CurrentRangedWeapon = NoItemThere;
	var CurrentMeleeWeapon = NoItemThere;
	var CurrentFood = NoItemThere;
	var CurrentMedKit = NoItemThere;
	var CurrentSpecial = NoItemThere;
	var CurrentArmor = NoItemThere;
	
	var MapItems = new Array();
	
	function Train(Skill)
	{
		var Chance = RollDie(100);
		
		if (Chance <= 60)  // +1
		{
			ModifyValueById(Skill,1);		
		}
		else if (Chance <= 90) // +2
		{
			ModifyValueById(Skill,2);		
		}
		else // +3
		{
			ModifyValueById(Skill,3);		
		}
	}
	
	function IsRifle(Item)
	{
		return (ItemInGroup(Item,Rifles));
	}
	
	function IsPistol(Item)
	{
		return (ItemInGroup(Item,Pistols));
	}
	
	function CellToCell(Cell_1,Cell_2)
	{
		return (Distance(GetRow(Cell_1),GetCol(Cell_1),GetRow(Cell_2),GetCol(Cell_2)));
	}
	
	function AttackZombie(Weapon,Cell)
	{
		if (Weapon == "Fists") 
		{
			var RollToHit = RollDie(100);
			
			if (RollToHit + GetValueById("MeleeSkill") >= BaseTargetNumber)
			{
				Message ("Killed a zombie with your bare hands!");
				Train("MeleeSkill");
				var SplashBack = RollDie(3);
				ModifyValueById("InfectedStatus",SplashBack);
				Message ("Scratched and/or bitten, infected for " + SplashBack);
				PlaceItemCell (Cell,RandomItem(SupplyItems),1);
			}
			else
			{
				Message ("At least you tried, be better if you had a weapon.");
			}
		}
		else if (IsGun(Weapon))
		{
			var RollToHit = RollDie(100);
			
			if (RollToHit + GetValueById("GunSkill") + 35 >= BaseTargetNumber)
			{
				Message ("Killed a zombie with " + Weapon);
				Train("GunSkill");
				PlaceItemCell (Cell,RandomItem(SupplyItems),1);				
				ModifyValueById("AmmoCount",-1);
			}
			else
			{
				ModifyValueById("AmmoCount",-1);
				Message ("Missed!");
			}
		}
		else if (IsMeleeWeapon(Weapon))
		{
			var RollToHit = RollDie(100);
			
			if (RollToHit + GetValueById("MeleeSkill") + 25 >= BaseTargetNumber)
			{
				Message ("Killed a zombie with " + Weapon);
				Train("MeleeSkill");
				PlaceItemCell (Cell,RandomItem(SupplyItems),1);				
			}
			else
			{
				Message ("Missed!");
			}		
		}
		else
		{
			alert ("Oops! Report Error #42 to subbob@gmail.com");
		}
		PlayerTurn("Attack",Loc_R,Loc_C);
	}
	
	function Target (Cell)
	{
		if (Visible(Cell) == 0)
		{
			if (CurrentSpecial == "Binoculars")
			{
				Message ("You see " + GetItemName(Cell) + " there");
				SetVisible(Cell,1);
				PlayerTurn("Use",Loc_R,Loc_C);
			}
			else 
			{
				Message ("You can't see that far");
			}
		}
		else
		{
			if (GetItemName(Cell) == "Zombie")
			{ // Attempting to attack Zombie
				if (CellToCell(PlayerCell,Cell) > 6) // Outside Rifle Range
				{
					Message ("Target outside range of all available weapons");
				}
				else if (CellToCell(PlayerCell,Cell) > 4) // Rifle Range
				{
					if (IsRifle(CurrentRangedWeapon))
					{
						if (GetValueById("AmmoCount") > 0)
						{
							AttackZombie(CurrentRangedWeapon,Cell);
							
						}
						else
						{
							Message ("*click* magazine is empty!");
						}
					}
					else
					{
						Message ("Equip a rifle to shoot at that range");
					}
				}
				else if (CellToCell(PlayerCell,Cell) > 2) // Pistol Range
				{
					if (IsPistol(CurrentRangedWeapon) || IsRifle(CurrentRangedWeapon))
					{
						if (GetValueById("AmmoCount") > 0)
						{
							AttackZombie(CurrentRangedWeapon,Cell);
						}
						else
						{
							Message ("*click* out of ammo!");
						}
					}
					else
					{
						Message ("Equip a gun to shoot at that range");
						// alert (CurrentRangedWeapon);
					}			
				}
				else if (CellToCell(PlayerCell,Cell) > 1) // Melee Weapon Range
				{
					if (CurrentMeleeWeapon != NoItemThere)
					{
							AttackZombie(CurrentMeleeWeapon,Cell);
					}
					else if (CurrentRangedWeapon != NoItemThere &&
							 GetValueById("AmmoCount") > 0)
					{
							AttackZombie(CurrentRangedWeapon,Cell);
					}
					else
					{
						Message ("You flail wildly, but can't reach the Zombie");
						Message ("Perhaps pick up a knife or something?");
					}
				}
				else  // Close Range - Punch or Melee
				{
							AttackZombie("Fists",Cell);
				}
			}
			else if ((CellToCell(PlayerCell,Cell)) == 1)
			{
				var ThatItem = GetItemName(Cell);
				
				if (IsGun(ThatItem))
				{
					var SwapName = CurrentRangedWeapon;
					CurrentRangedWeapon = ThatItem;
					Equip(ThatItem);
					PlaceItem(GetRow(Cell),GetCol(Cell),SwapName,1);
				}
				else if (IsMeleeWeapon(ThatItem))
				{
					var SwapName = CurrentMeleeWeapon;
					CurrentMeleeWeapon = ThatItem;
					Equip(ThatItem);
					PlaceItem(GetRow(Cell),GetCol(Cell),SwapName,1);				
				}
				else if (IsArmor(ThatItem))
				{
					// Not yet implemented
				}
				else if (IsSpecial(ThatItem))
				{
					// Not yet implemented
				}
				else
				{
					PickUp (ThatItem);
					PlaceItem(GetRow(Cell),GetCol(Cell),NoItemThere,1);									
				}
			}
			else
			{
				Message ("You see " + GetItemName(Cell) + " there");
			}
			PlayerTurn("Use",Loc_R,Loc_C);
		}
	}
	
	function RandomItem(List)
	{
		return(List[RollDie(List.length) - 1]);
	}
	
	function Debug(Msg)
	{
		var DebugWindow = document.getElementById("DebugWindow");
		if (DebugStatus == 1)
		{
			DebugWindow.innerHTML += Msg + "\n";
		}
	}
	
	function RandomType(CurR,CurC)
	{
		AmmoChance = RollDice(4,4);
		FoodChance = RollDice(2,6) + 2 + AmmoChance;
		MedicalChance = RollDice(2,6) + 2 + FoodChance;
		SpecialChance = RollDice(2,3) + 1 + MedicalChance;
		GunsChance = RollDice(2,4) + SpecialChance;
		MeleeWeaponsChance = RollDie(3,3) + GunsChance;
		SuppliesChance = RollDie(3,6) + MeleeWeaponsChance;

		var ChanceRoll = new Number(RollDie(100));
		
		if (CurR == 0 && CurC == 0)
		{
				Debug("AmmoChance: " + AmmoChance + "\n" +
			"FoodChance: " + FoodChance + "\n" +
			"MedicalChance: " + MedicalChance + "\n" +
			"SpecialChance: " + SpecialChance + "\n" +
			"GunsChance: " + GunsChance + "\n" +
			"MeleeWeaponsChance: " + MeleeWeaponsChance + "\n" +
			"SuppliesChance: " + SuppliesChance + "\n");
		}
	
		var DeltaR = new Number (Math.abs(Center_R - CurR));
		var DeltaC = new Number (Math.abs(Center_C - CurC));
		
		if (DeltaR <= DeltaC)
		{
			var MinDelta = new Number(DeltaR);
		}
		else
		{
			var MinDelta = new Number(DeltaC);
		}

		var RangeMod = new Number (15 - MinDelta * 5);


		Debug ("ChanceRoll: " + ChanceRoll);
		Debug ("DeltaR: " + DeltaR);
		Debug ("DeltaC:" + DeltaC);
		Debug ("MinDelta:" + MinDelta);
		Debug ("RangeMod:" + RangeMod);

		
		ChanceRoll += RangeMod;
		Debug ("ChanceRoll w/RangeMod:" + ChanceRoll);		
		if (ChanceRoll <= AmmoChance)
		{
			AmmoIcons++;
			return(RandomItem(AmmoItems));
		}
		else if (ChanceRoll <= FoodChance)
		{
			FoodIcons++;
			return(RandomItem(FoodItems));			
		}
		else if (ChanceRoll <= MedicalChance)
		{
			MedicalIcons++;
			return(RandomItem(MedicalItems));			
		}
		else if (ChanceRoll <= GunsChance)
		{
			GunIcons++;
			return(RandomItem(Guns));			
		}
		else if (ChanceRoll <= MeleeWeaponsChance)
		{
			MeleeIcons++;
			return(RandomItem(MeleeWeapons));			
		}
		else if (ChanceRoll <= SuppliesChance)
		{
			SupplyIcons++;
			return(RandomItem(SupplyItems));			
		}
		else // Empty terrain
		{
			return(NoItemThere);
		}	
	}
	
	function FillMap()
	{
		var RCtr = 0;
		var CCtr = 0;
		
		SupplyIcons = new Number (0);
		MeleeIcons = new Number (0);
		GunIcons = new Number (0);
		MedicalIcons = new Number (0);
		FoodIcons = new Number (0);
		AmmoIcons = new Number (0);
		
		var GoodMap = 0;
		
		while (!GoodMap)
		{
			SupplyIcons = 0;
			MeleeIcons = 0;
			GunIcons = 0;
			MedicalIcons = 0;
			FoodIcons = 0;
			AmmoIcons = 0;
			
			for (RCtr=0; RCtr <= High_R; RCtr++)
			{
				for (CCtr=0; CCtr <= Right_C; CCtr++)
				{
					var NewItem = RandomType(RCtr,CCtr);
					Debug ("Added: " + NewItem + " to map at R" + RCtr + "C" + CCtr);
					MapItems.push(NewItem);
					PlaceItem(RCtr,CCtr,NewItem,0);				
				}
			}
			
			/*
			alert (	"Supplies: " + SupplyIcons + "\n" +
					"Weapons: " + MeleeIcons + "\n" +
					"Guns: " + GunIcons + "\n" +
					"Medical: " + MedicalIcons + "\n" +
					"Food: " + FoodIcons + "\n" +
					"Ammo: " + AmmoIcons);
			*/
			
			
			if (SupplyIcons < 4)
			{
				GoodMap = 1;
			}
			else if (MeleeIcons < 4)
			{
				GoodMap = 1;
			}
			else if (GunIcons < 4)
			{
				GoodMap = 1;
			}
			else if (MedicalIcons < 4)
			{
				GoodMap = 1;
			}
			else if (FoodIcons < 4)
			{
				GoodMap = 1;
			}
			else if (AmmoIcons < 4)
			{
				GoodMap = 1;
			}
			else
			{
				GoodMap = 1;
			}
		}
	}
	
	function Distance(R1,C1,R2,C2)
	{
		var R_Squared = (R2 - R1) * (R2 - R1);
		var C_Squared = (C2 - C1) * (C2 - C1);
		
		return (Math.floor(Math.sqrt(R_Squared + C_Squared)));
	}
	
	function PlaceZombies()
	{
		var RCtr = 0;
		var CCtr = 0;
		/*
			Range 1 	- 0%
			Range 2 	- 5%
			Range 3,4	= 8%
			Range 5,6	- 10%
			Range 7		- 11%
		
		*/
		var ZombieChances = new Array (0,0,5,8,8,10,10,11);
		ZombieIcons = 0;
		
		for (RCtr = Low_R; RCtr <= High_R; RCtr++)
		{
			for (CCtr = Left_C; CCtr <= Right_C; CCtr++)
			{
				var ChanceRoll = RollDie(100);
				var Dist = Distance(RCtr,CCtr,Center_R,Center_C);
				if (ChanceRoll <= ZombieChances[Dist])
				{
					PlaceItem(RCtr,CCtr,"Zombie",0);	
					ZombieIcons++;
				}
			}
		}
		// alert (ZombieIcons + " Zombies placed");
	}
	
	function GetValueById(ObjectId)
	{
		// alert ("GetValueById: " + ObjectId);
		var Element = document.getElementById(ObjectId);
		
		var Temp = new Number(Element.innerHTML);
		
		return (Temp);
	}
	
	function ModifyValueById(ObjectId,Change)
	{
		var CurrentValue = new Number(GetValueById(ObjectId));
		var Element = document.getElementById(ObjectId);
		
		var NewValue = new Number (CurrentValue + Change);
		
		// alert (NewValue + " = " + CurrentValue + " + " + Change);
		
		Element.innerHTML = NewValue;
	}
	
	function CurrentArmorValue(ArmorType)
	{
		switch (ArmorType)
		{
			case NoItemThere 	: 	return(0);
								break;
							
			case "LeatherJacket"	:	return(5);
								break;
								
			case "Kevlar"	:	return(10);
								break;

			case "RiotGear"	: 	return(15);
								break;
			
			default			:	return(0);
								
		}
	}
	
	function RollDie (DieType)
	{
		return (Math.floor((Math.random() * DieType) + 1));
	}
	
	function RollDice (Quantity,DieType)
	{
		var ctr = 0;
		var result=0;
		
		for (ctr = 0; ctr < Quantity; ctr++)
		{
			result += RollDie(DieType);
		}
		
		return (result);
	}
	
	function ConvertToZombie()
	{
		var Infection = new Number (GetValueById("InfectedStatus"));
		// alert ("Checking " + Infection + " >= " + InfectionThreshold);
		if (Infection >= InfectionThreshold)
		{
			var Roll = RollDie(100);
			var Chance = new Number ( (Infection - InfectionThreshold) * 100 /
									  InfectionCrossOver);
			Chance = Math.floor(Chance); // Round down to nearest integer
			// Message ("Conversion Check. Roll: " + Roll + " Chance: " + Chance);
			if (Roll < Chance)
			{
				return (1);
			}
			else
			{
				return (0);
			}
									  
		}
		else
		{
			return (0);
		}
	}	
	
   function IsGun(Item)
   {
		return (ItemInGroup(Item,Guns));
   }

   function IsFood(Item)
   {
		return (ItemInGroup(Item,FoodItems));   
   }
   
   function IsMedical(Item)
   {
		return (ItemInGroup(Item,MedicalItems));   
   }
   
   function IsSupplies(Item)
   {
		return (ItemInGroup(Item,SupplyItems));   
   }
   
   function IsMeleeWeapon(Item)
   {
		return (ItemInGroup(Item,MeleeWeapons));
   }

   function ItemInGroup (Item,List)
   {
 		for (var ctr = 0; ctr < List.length; ctr++)
		{
			if (Item == List[ctr])
			{
				return(1);
			}
		}
		return (0);  
   }
   
	function InfectPlayer(Damage)
	{

		
		var NewInfection = new Number (Math.floor(Damage * InfectionRatio));
			
		ModifyValueById ("InfectedStatus",NewInfection);
	}
	
	function DamagePlayer(Damage)
   {
		// alert ('Calling ModifyValueByID("HealthStatus",' + -Damage);
		ModifyValueById ("HealthStatus",-Damage);			
		InfectPlayer(Damage);
		if (GetValueById("HealthStatus") <= 0)
		{
			return(1);
		}
		else
		{
			return(0);
		}
   }
   
   function ZombieAttack(Type)
   {
		// "blunder" 	- player walked into the zombie
		// "normal" 	- Zombie attacks player in adjacent area
		var BaseHitChance = new Number(50);
		var DamageDice = new Number(2);
		
		BaseHitChance -= CurrentArmorValue(CurrentArmor);  // Player armor reduces chance to hit
		
		if (Type == "blunder")
		{
			BaseHitChance += 25;		// Walking into them is stupid!
			DamageDice++;
		}
		
		var HitRoll = new Number(RollDie(100));
		
		if (HitRoll <= BaseHitChance)
		{
			// Message ("Rolling " + DamageDice + " D6");
			var Damage = new Number(RollDice(DamageDice,6));
			if (Damage < 5)
			{
				Message ("Zombie scratched you for " + Damage + " damage");
			}
			else if (Damage < 10)
			{
				Message ("Zombie bit you for " + Damage + " damage");
			}
			else
			{
				Message ("Zombie bit and scratched you for " + Damage + " damage");
			}
			
			if (DamagePlayer(Damage))
			{
				Message ("You died and came back as a zombie. GAME OVER!");
				Condition ("Died and came back as a Zombie");
				GameOver = 1;
			}
		}
		else
		{
			Message ("Zombie attacked and missed.");
		}
   }
   
	function IsSpecial(Item)
	{
		return (ItemInGroup(Item,SpecialItems));		

	}
	
	function IsArmor(Item)
	{
		return (ItemInGroup(Item,ArmorItems));

	}
	
	function IsAmmo(Item)
	{
		return (ItemInGroup(Item,AmmoItems));
	}
	
   function IsBow(Item)
   {
		return (ItemInGroup(Item,Bows));
   }   
   
   function IsWeapon(Item)
   {
		if (IsGun(Item) || IsMeleeWeapon(Item) || IsBow(Item))
		{
			return (1);
		}
		else
		{
			return (0);
		}
   }
   
	function Message(Msg)
	{
		MsgWindow.innerHTML = Msg + "\n" + MsgWindow.innerHTML;
		MessageCount++;
		if (MessageCount > 10)
		{
			var StatusWindow = document.getElementById ("MsgWindowStatus");
			
			var Notice = "&nbsp;&nbsp;<B>" + MessageCount + " messages</B>";
			StatusWindow.innerHTML = Notice;
		}
	}

	function Condition(Msg)
	{
		var Element = document.getElementById("Condition");
		
		Element.bgcolor = "Yellow";
		Element.innerHTML = '<DIV><font color="red"><B>' + Msg + '</B></font></DIV>';
		
	}
	
	function Get_Cell_Id (Cell)
	{
		var pattern = /R\d+C\d+/;
		var Matches = pattern.exec(Cell);
		return(Matches[0]);	
	}
	
	function PickUp (Item)
	{
		if (IsMedical(Item))
		{
			ModifyValueById("MedKitCount",1);
			Message ("Picked up " + Item);
		}
		else if (IsSupplies(Item))
		{
			ModifyValueById("SuppliesCount",3);
			Message ("Picked up " + Item);
		}
		else if (IsFood(Item))
		{
			ModifyValueById("FoodCount",1);
			Message ("Picked up " + Item);
		}
		else if (IsAmmo(GroundItem))
		{
			ModifyValueById("AmmoCount",RollDie(3)+RollDie(2));
			Message ("Picked up " + Item);
		}
		else if (IsSpecial(Item))
		{ 
			if (GroundItem == "Binoculars")
			{
				Equip(Item);
			}
			
			// Not yet implemented
		}
		else if (IsArmor(Item))
		{
			// Not yet implemented
		}
	}
	
	function Equip (Item)
	{
		var Cell_Id;
		
		if (IsGun(Item))
		{
			Cell_Id = "GunSlot";
			CurrentRangedWeapon = Item;
		}
		else if (IsMeleeWeapon(Item))
		{
			Cell_Id = "WeaponSlot";
			CurrentMeleeWeapon = Item;
		}
		else if (IsSpecial(Item))
		{
			Cell_Id = "SpecialSlot";
			CurrentSpecial = Item;
		}
		else if (IsArmor(Item))
		{
			Cell_Id = "Armor";
			CurrentArmor = Item;
		}
		var ThisCell = document.getElementById(Cell_Id);
		var DivStr = '<DIV value="ItemName:' + Item + '">';
		ThisCell.innerHTML = DivStr;
		ThisCell.innerHTML += '<img src="' + Item + '.png"></img>';
		ThisCell.innerHTML += '</DIV>';	
		Message ("Equipped: " + Item);
	}
	
	function FillCells()
	{
		var Cells = document.getElementsByName("cell");
		
		var ctr = 0;
		
		for (ctr = 0; ctr < Cells.length; ctr++)
		{
			var ThisId = Get_Cell_Id (Cells[ctr].outerHTML);
			PlaceItem(GetRow(ThisId),GetCol(ThisId),NoItemThere,0);
		}
	}

	function Examine (Cell)
	{
		var ThisItem = GetItemName(Cell);
		Message ("Location " + Cell + " contains " + ThisItem);	
	}

	function Visible (Cell)
	{
		var TargetCell = document.getElementById(Cell);		
		var pattern = /Visible:(\d)/;
		var Matches = pattern.exec(TargetCell.innerHTML);
		var VisibleStatus = Matches[1];
		return(Matches[1]);
	}
	
	function SetVisible(Cell,Visibility)
	{
		PlaceItem(GetRow(Cell),GetCol(Cell),GetItemName(Cell),Visibility);
	}

	function ValidR(Row)
	{
		var Temp;
		if ( Row >= Low_R && Row <= High_R)
		{
			Temp = 1;
		}
		else
		{
			Temp = 0;
		}
		return(Temp);
	}

	function ValidC(Col)
	{
		if ( Col >= Left_C && Col <= Right_C)
		{
			return (1);
		}
		else
		{
			return (0);
		}
	}
	
	function CloseZombies(Cell)
	{
		var CellList = new Array;
		
		var Zombies = new Array;
		
		var ctr = 0;
		
		CellList = AdjacentCells(Cell);
		
		for (ctr = 0; ctr < CellList.length; ctr++)
		{
			if (GetItemName(CellList[ctr]) == "Zombie")
			{
				Zombies.push(CellList[ctr]);
			}
		}
		return (Zombies);
	}
	
	function AdjacentCells(Cell)
	{
		var CellList = new Array;
		
		var R = new Number (0);
		var C = new Number (0);
		
		var ThisR = new Number(GetRow(Cell));
		var ThisC = new Number(GetCol(Cell));
		
		var TargetR = new Number;
		var TargetC = new Number;
		var ThisCell;
		
		for (R = -1; R < 2; R++)
		{
			for (C = -1; C < 2; C++)
			{
				TargetR = ThisR + R;
				TargetC = ThisC + C;
				
				if ((R != 0) || (C != 0))  
				{
					if (ValidR(TargetR) && ValidC(TargetC))
					{
						ThisCell = MakeCell(TargetR,TargetC);
						CellList.push(ThisCell);
					}
				}
			}
		}		
		return (CellList);
	}
	
	function CheckVisibility(Cell)
	{
		var Cells = AdjacentCells(Cell);
		var ctr;
		
		for (ctr = 0; ctr < Cells.length; ctr++)
		{
			if (Visible(Cells[ctr]) == 0)
			{
				SetVisible(Cells[ctr],1);
			}
		}
	}
	
	function GetItemName(Cell)
	{

		var TargetCell = document.getElementById(Cell);		
		var pattern = /ItemName:([\w]+)/;
		var Matches = pattern.exec(TargetCell.innerHTML);
		return(Matches[1]);
	}
	
	function GetRow(Cell)
	{
		var pattern = /R(\d+)C\d+/;
		var Matches = pattern.exec(Cell);
		return(Matches[1]);
	}

	function GetCol(Cell)
	{
		var pattern = /R\d+C(\d+)/;
		var Matches = pattern.exec(Cell);
		return(Matches[1]);
	}

	function MakeCell(Row,Col)
	{
		return ("R" + Row + "C" + Col);
	}

	function PlayerTurn(Action,NewR,NewC)
	{
		// All turns are initiated by a player action, either Move, Shoot or Use
		
		if (GameOver)		// Do nothing if game is over
		{
			return (0);
		}
		
		switch (Action)
		{
			case "Move"		:		MovePlayer (NewR,NewC);
									break;
									
			case "Attack"	:		// Player Attacked - resolved elsewhere
									break;
									
			case "Use"		:		// Player Used Item - resolved elsewhere
									break;
		}

		// Zombies move toward player after each player action
		// (Except if player in an "action free" zone, then it's a probabibility)
		
		// MoveZombies();
		
		// SpawnItems();  ????
		
		// SpawnZombies();  (on map edges)
		
		// Check status of infection

		if (ConvertToZombie() && !GameOver)
		{
			Message ("** Zombified! ** You succumbed to the infection");
			Condition ("Killed by infection, returned as a Zombie");
			GameOver = 0;
		}
		
		ZombiesTurn();
	}
	
	function ZombiesTurn()
	{
		var Threats = new Array;
		Threats = CloseZombies(PlayerCell);
		if (Threats.length > 0)
		{
			if (!ThreatStatus)
			{
				Message ("Danger! Zombies close enough to hurt you.");
				ThreatStatus = 1;
			}
			var ctr;
			
			for (ctr = 0; ctr < Threats.length; ctr++)
			{
				ZombieAttack("normal");
			}				
		}
		else
		{
			if (ThreatStatus)
			{
				Message ("Take a breath, no Zombies threatening you.");
				ThreatStatus = 0;
			}
		}
		
	}
	
	function MovePlayer (NewR,NewC)
	{
		var Threats = new Array;
		var TargetCell = MakeCell(NewR,NewC);
		
		TargetItem = GetItemName(TargetCell);
		
		if (GameOver)
		{
			return(0);
		}
		
		if (TargetItem == "Zombie")
		{
			Message ("Blindly walked into a Zombie. It attacks you.");
			ZombieAttack("blunder");
			// alert ("*mumble* *mumble* BITE!");
		}
		else
		{
			PlaceItem(Loc_R,Loc_C,GroundItem,1);
			GroundItem = TargetItem; // Save item for when player moves out
			
			if (IsWeapon(GroundItem))
			{

				// Message ("You found a weapon.");
				if (IsGun(GroundItem) || IsBow(GroundItem))
				{
					if (CurrentRangedWeapon == NoItemThere)
					{
						Message ("Picked up the " + GroundItem + ", you did not have a ranged weapon.");
						Equip (GroundItem);
						GroundItem = NoItemThere;
					}
					else
					{
						Message ("Pick up " + GroundItem + " if better than " + CurrentRangedWeapon);
					}
				}
				if (IsMeleeWeapon(GroundItem))
				{
					if (CurrentMeleeWeapon == NoItemThere)
					{
						Message ("Picked up the " + GroundItem + ", you did not have a melee weapon.");
						Equip (GroundItem);
						GroundItem = NoItemThere;
					}
					else
					{
						Message ("Pick up " + GroundItem + " if better than " + CurrentMeleeWeapon);
					}
				}				
			}
			else
			{
				PickUp (GroundItem);
				GroundItem = NoItemThere;
			}
			PlaceItem(NewR,NewC,"crosshairs",1);
			Loc_R = NewR;
			Loc_C = NewC;
			PlayerCell = MakeCell(Loc_R,Loc_C);
			CheckVisibility(PlayerCell);
		
		}
	}

	function PlaceItemCell (Cell,Item,Visible)
	{
		PlaceItem(GetRow(Cell),GetCol(Cell),Item,Visible);
	}
	
	function PlaceItem(CellR,CellC,Item,Visible)
	{
		var ThisCell = document.getElementById("R"+CellR+"C"+CellC);
		var DivStr = '<DIV value="ItemName:' + Item + ' Visible:' + Visible + '">';
		
		ThisCell.innerHTML = DivStr;
		if (Visible)
		{
			ThisCell.innerHTML += '<img src="' + Item + '.png"></img>';
		}
		else
		{
			ThisCell.innerHTML += '<img src="unknown.png"></img>';		
		}
		ThisCell.innerHTML += '</DIV>';		
	}

	function checkArrowKeys(e){
		var arrs= [], key= window.event? event.keyCode: e.keyCode;
		arrs[37]= 'left';
		arrs[38]= 'up';
		arrs[39]= 'right';
		arrs[40]= 'down';
		if(arrs[key])
		{
			switch(arrs[key])
			{
				case 'down': if (Loc_R != High_R)
							 {	
								PlayerTurn ("Move",Loc_R + 1,Loc_C);
							 }
							 else
							 {
								Message ("At bottom of map");
							 }
							break;
							
				case 'up': if (Loc_R != Low_R)
							 {	
								PlayerTurn ("Move",Loc_R - 1,Loc_C);
							 }
							 else
							 {
								Message ("At top of map");
							 }
							break;
				
				case 'left': if (Loc_C != Left_C)
							 {	
								PlayerTurn ("Move",Loc_R,Loc_C - 1);
							 }
							 else
							 {
								Message ("At left of map");
							 }
							break;

				case 'right': if (Loc_C != Right_C)
							 {	
								PlayerTurn ("Move",Loc_R,Loc_C + 1);
							 }
							 else
							 {
								Message ("At right of map");
							 }
							break;

			}
		}
	}

	function UseFood()
	{
		if (GetValueById("FoodCount") > 0)
		{
			var HealValue = new Number (RollDie(3) + RollDie(2));
			ModifyValueById("HealthStatus",HealValue);
			Message ("Ate some food, healed self for " + HealValue);
			ModifyValueById("FoodCount",-1);
		}
		else
		{
			alert ("Pick up food or drink to remain healthy");
		}
		PlayerTurn("Use",Loc_R,Loc_C);
	}
	
	function UseSupplies()
	{	
		if (GetValueById("SuppliesCount") >= 10)
		{
			ModifyValueById("FoodCount",1);
			ModifyValueById("MedKitCount",1);
			Message ("Converted supplies to 1 Food and 1 MedKit");
			ModifyValueById("SuppliesCount",-10);
		}
		else
		{
			alert ("Use supplies convert to make Food and Medicine\n" +
				   "Convert 10 points of supplies to 1 of each");
		}
		PlayerTurn("Use",Loc_R,Loc_C);
	}
	
	function UseMedkit()
	{
		if (GetValueById("MedKitCount") > 0)
		{
			var HealValue = new Number (RollDie(10));
			ModifyValueById("HealthStatus",HealValue);
			Message ("Expended medical supplies, healed self for " + HealValue);
			ModifyValueById("MedKitCount",-1);
			Train("MedicSkill");
		}
		else
		{
			alert ("Pick up medical supplies to heal yourself");
		}
		PlayerTurn("Use",Loc_R,Loc_C);
	}

	function Reload()
	{
		// alert ("Reload current weapon\nReduce ammo count");
		Message ("You must have reloaded automatically in the heat of battle");
	}

	function ReportInfectedStatus()
	{
		alert ("As infection increases you risk a chance of dying from it alone");
	}

	function ReportHealthStatus()	
	{
		alert ("Use medical kits, food and supplies to maintain your health");
	}

	function ClearMsgWindow()
	{
		var WindowStatus = document.getElementById("MsgWindowStatus");
		WindowStatus.innerHTML = "";
		MsgWindow.innerHTML = "";
		MessageCount = 0;
	}

	function CheckItem(ItemType)
	{
		alert ("Provide status about current " + ItemType + "\n" +
			   "with options (Drop, Use, Replair, Replace, Reload, etc)");
	}

	function checkKeys(e)
	{
		if (String.fromCharCode(e.charCode) == "m" && e.ctrlKey)
		{
			var VisCode;
			if (ToggledVisibility == 1)
			{
				VisCode = 0;
				ToggledVisibility = 0;
			}
			else
			{
				VisCode = 1;
				ToggledVisibility = 1;
			}			
			var RCtr;
			var CCtr;

			for (RCtr=0; RCtr <= High_R; RCtr++)
			{
				for (CCtr=0; CCtr <= Right_C; CCtr++)
				{
					SetVisible(MakeCell(RCtr,CCtr),VisCode);
				}
			}
			if (ToggledVisibility == 0)
			{
				CheckVisibility(PlayerCell);
				SetVisible(PlayerCell,1);
			}
		}
	}
	document.onkeydown=checkArrowKeys;
	// document.onkeyup=checkUpKeys;
	document.onkeypress=checkKeys;
	

</SCRIPT>
</HEAD>
<BODY>
<TABLE width="692" border="2">
	<TR>
		<TD width="442">
			<TABLE width="442">
				<TR>
					<TD colspan="13" align="center">
						<H2>The Walking Dead Game</H2>		
					</TD>				
				</TR>
				<TR>
					<TD colspan="13" align="center" bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD width="1" align="center" valign="center" bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R0C0" onclick="Target('R0C0')"></TD>
					<TD name="cell" width="40" id="R0C1" onclick="Target('R0C1')"></TD>
					<TD name="cell" width="40" id="R0C2" onclick="Target('R0C2')"></TD>
					<TD name="cell" width="40" id="R0C3" onclick="Target('R0C3')"></TD>
					<TD name="cell" width="40" id="R0C4" onclick="Target('R0C4')"></TD>
					<TD name="cell" width="40" id="R0C5" onclick="Target('R0C5')"></TD>
					<TD name="cell" width="40" id="R0C6" onclick="Target('R0C6')"></TD>
					<TD name="cell" width="40" id="R0C7" onclick="Target('R0C7')"></TD>
					<TD name="cell" width="40" id="R0C8" onclick="Target('R0C8')"></TD>
					<TD name="cell" width="40" id="R0C9" onclick="Target('R0C9')"></TD>
					<TD name="cell" width="40" id="R0C10" onclick="Target('R0C10')"></TD>
					<TD width="1" align="center" valign="center" bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R1C0" onclick="Target('R1C0')"></TD>
					<TD name="cell" width="40" id="R1C1" onclick="Target('R1C1')"></TD>
					<TD name="cell" width="40" id="R1C2" onclick="Target('R1C2')"></TD>
					<TD name="cell" width="40" id="R1C3" onclick="Target('R1C3')"></TD>
					<TD name="cell" width="40" id="R1C4" onclick="Target('R1C4')"></TD>
					<TD name="cell" width="40" id="R1C5" onclick="Target('R1C5')"></TD>
					<TD name="cell" width="40" id="R1C6" onclick="Target('R1C6')"></TD>
					<TD name="cell" width="40" id="R1C7" onclick="Target('R1C7')"></TD>
					<TD name="cell" width="40" id="R1C8" onclick="Target('R1C8')"></TD>
					<TD name="cell" width="40" id="R1C9" onclick="Target('R1C9')"></TD>
					<TD name="cell" width="40" id="R1C10" onclick="Target('R1C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R2C0" onclick="Target('R2C0')"></TD>
					<TD name="cell" width="40" id="R2C1" onclick="Target('R2C1')"></TD>
					<TD name="cell" width="40" id="R2C2" onclick="Target('R2C2')"></TD>
					<TD name="cell" width="40" id="R2C3" onclick="Target('R2C3')"></TD>
					<TD name="cell" width="40" id="R2C4" onclick="Target('R2C4')"></TD>
					<TD name="cell" width="40" id="R2C5" onclick="Target('R2C5')"></TD>
					<TD name="cell" width="40" id="R2C6" onclick="Target('R2C6')"></TD>
					<TD name="cell" width="40" id="R2C7" onclick="Target('R2C7')"></TD>
					<TD name="cell" width="40" id="R2C8" onclick="Target('R2C8')"></TD>
					<TD name="cell" width="40" id="R2C9" onclick="Target('R2C9')"></TD>
					<TD name="cell" width="40" id="R2C10" onclick="Target('R2C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R3C0" onclick="Target('R3C0')"></TD>
					<TD name="cell" width="40" id="R3C1" onclick="Target('R3C1')"></TD>
					<TD name="cell" width="40" id="R3C2" onclick="Target('R3C2')"></TD>
					<TD name="cell" width="40" id="R3C3" onclick="Target('R3C3')"></TD>
					<TD name="cell" width="40" id="R3C4" onclick="Target('R3C4')"></TD>
					<TD name="cell" width="40" id="R3C5" onclick="Target('R3C5')"></TD>
					<TD name="cell" width="40" id="R3C6" onclick="Target('R3C6')"></TD>
					<TD name="cell" width="40" id="R3C7" onclick="Target('R3C7')"></TD>
					<TD name="cell" width="40" id="R3C8" onclick="Target('R3C8')"></TD>
					<TD name="cell" width="40" id="R3C9" onclick="Target('R3C9')"></TD>
					<TD name="cell" width="40" id="R3C10" onclick="Target('R3C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R4C0" onclick="Target('R4C0')"></TD>
					<TD name="cell" width="40" id="R4C1" onclick="Target('R4C1')"></TD>
					<TD name="cell" width="40" id="R4C2" onclick="Target('R4C2')"></TD>
					<TD name="cell" width="40" id="R4C3" onclick="Target('R4C3')"></TD>
					<TD name="cell" width="40" id="R4C4" onclick="Target('R4C4')"></TD>
					<TD name="cell" width="40" id="R4C5" onclick="Target('R4C5')"></TD>
					<TD name="cell" width="40" id="R4C6" onclick="Target('R4C6')"></TD>
					<TD name="cell" width="40" id="R4C7" onclick="Target('R4C7')"></TD>
					<TD name="cell" width="40" id="R4C8" onclick="Target('R4C8')"></TD>
					<TD name="cell" width="40" id="R4C9" onclick="Target('R4C9')"></TD>
					<TD name="cell" width="40" id="R4C10" onclick="Target('R4C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R5C0" onclick="Target('R5C0')"></TD>
					<TD name="cell" width="40" id="R5C1" onclick="Target('R5C1')"></TD>
					<TD name="cell" width="40" id="R5C2" onclick="Target('R5C2')"></TD>
					<TD name="cell" width="40" id="R5C3" onclick="Target('R5C3')"></TD>
					<TD name="cell" width="40" id="R5C4" onclick="Target('R5C4')"></TD>
					<TD name="cell" width="40" id="R5C5" onclick="Target('R5C5')"></TD>
					<TD name="cell" width="40" id="R5C6" onclick="Target('R5C6')"></TD>
					<TD name="cell" width="40" id="R5C7" onclick="Target('R5C7')"></TD>
					<TD name="cell" width="40" id="R5C8" onclick="Target('R5C8')"></TD>
					<TD name="cell" width="40" id="R5C9" onclick="Target('R5C9')"></TD>
					<TD name="cell" width="40" id="R5C10" onclick="Target('R5C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R6C0" onclick="Target('R6C0')"></TD>
					<TD name="cell" width="40" id="R6C1" onclick="Target('R6C1')"></TD>
					<TD name="cell" width="40" id="R6C2" onclick="Target('R6C2')"></TD>
					<TD name="cell" width="40" id="R6C3" onclick="Target('R6C3')"></TD>
					<TD name="cell" width="40" id="R6C4" onclick="Target('R6C4')"></TD>
					<TD name="cell" width="40" id="R6C5" onclick="Target('R6C5')"></TD>
					<TD name="cell" width="40" id="R6C6" onclick="Target('R6C6')"></TD>
					<TD name="cell" width="40" id="R6C7" onclick="Target('R6C7')"></TD>
					<TD name="cell" width="40" id="R6C8" onclick="Target('R6C8')"></TD>
					<TD name="cell" width="40" id="R6C9" onclick="Target('R6C9')"></TD>
					<TD name="cell" width="40" id="R6C10" onclick="Target('R6C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R7C0" onclick="Target('R7C0')"></TD>
					<TD name="cell" width="40" id="R7C1" onclick="Target('R7C1')"></TD>
					<TD name="cell" width="40" id="R7C2" onclick="Target('R7C2')"></TD>
					<TD name="cell" width="40" id="R7C3" onclick="Target('R7C3')"></TD>
					<TD name="cell" width="40" id="R7C4" onclick="Target('R7C4')"></TD>
					<TD name="cell" width="40" id="R7C5" onclick="Target('R7C5')"></TD>
					<TD name="cell" width="40" id="R7C6" onclick="Target('R7C6')"></TD>
					<TD name="cell" width="40" id="R7C7" onclick="Target('R7C7')"></TD>
					<TD name="cell" width="40" id="R7C8" onclick="Target('R7C8')"></TD>
					<TD name="cell" width="40" id="R7C9" onclick="Target('R7C9')"></TD>
					<TD name="cell" width="40" id="R7C10" onclick="Target('R7C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R8C0" onclick="Target('R8C0')"></TD>
					<TD name="cell" width="40" id="R8C1" onclick="Target('R8C1')"></TD>
					<TD name="cell" width="40" id="R8C2" onclick="Target('R8C2')"></TD>
					<TD name="cell" width="40" id="R8C3" onclick="Target('R8C3')"></TD>
					<TD name="cell" width="40" id="R8C4" onclick="Target('R8C4')"></TD>
					<TD name="cell" width="40" id="R8C5" onclick="Target('R8C5')"></TD>
					<TD name="cell" width="40" id="R8C6" onclick="Target('R8C6')"></TD>
					<TD name="cell" width="40" id="R8C7" onclick="Target('R8C7')"></TD>
					<TD name="cell" width="40" id="R8C8" onclick="Target('R8C8')"></TD>
					<TD name="cell" width="40" id="R8C9" onclick="Target('R8C9')"></TD>
					<TD name="cell" width="40" id="R8C10" onclick="Target('R8C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R9C0" onclick="Target('R9C0')"></TD>
					<TD name="cell" width="40" id="R9C1" onclick="Target('R9C1')"></TD>
					<TD name="cell" width="40" id="R9C2" onclick="Target('R9C2')"></TD>
					<TD name="cell" width="40" id="R9C3" onclick="Target('R9C3')"></TD>
					<TD name="cell" width="40" id="R9C4" onclick="Target('R9C4')"></TD>
					<TD name="cell" width="40" id="R9C5" onclick="Target('R9C5')"></TD>
					<TD name="cell" width="40" id="R9C6" onclick="Target('R9C6')"></TD>
					<TD name="cell" width="40" id="R9C7" onclick="Target('R9C7')"></TD>
					<TD name="cell" width="40" id="R9C8" onclick="Target('R9C8')"></TD>
					<TD name="cell" width="40" id="R9C9" onclick="Target('R9C9')"></TD>
					<TD name="cell" width="40" id="R9C10" onclick="Target('R9C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD bgcolor="#000066"></TD>
					<TD name="cell" width="40" id="R10C0" onclick="Target('R10C0')"></TD>
					<TD name="cell" width="40" id="R10C1" onclick="Target('R10C1')"></TD>
					<TD name="cell" width="40" id="R10C2" onclick="Target('R10C2')"></TD>
					<TD name="cell" width="40" id="R10C3" onclick="Target('R10C3')"></TD>
					<TD name="cell" width="40" id="R10C4" onclick="Target('R10C4')"></TD>
					<TD name="cell" width="40" id="R10C5" onclick="Target('R10C5')"></TD>
					<TD name="cell" width="40" id="R10C6" onclick="Target('R10C6')"></TD>
					<TD name="cell" width="40" id="R10C7" onclick="Target('R10C7')"></TD>
					<TD name="cell" width="40" id="R10C8" onclick="Target('R10C8')"></TD>
					<TD name="cell" width="40" id="R10C9" onclick="Target('R10C9')"></TD>
					<TD name="cell" width="40" id="R10C10" onclick="Target('R10C10')"></TD>
					<TD bgcolor="#000066"></TD>
				</TR>
				<TR>
					<TD colspan="13" align="center" bgcolor="#000066"></TD>
				</TR>
			</TABLE>
		</TD>
			
		<TD width="250">

			<TABLE width="250">
				<TR>
					<TD colspan="5" align="center">
						<font size="5"><B>Heads Up Display (HUD)</B></font>
					</TD>
				</TR>				
				<TR>
					<TD></TD>
					<TD colspan="3" align="center">
						<DIV>Click HUD zones</b> for more information</DIV>
					</TD>
					<TD></TD>
				</TR>
				<TR>
					<TD width="40" align="center"  
					    onclick="ReportHealthStatus()">
						<B>Health</B>
					</TD>
					<TD width="40" align="center"  
					    onclick="ReportHealthStatus()">
						<B>Infection</B>
					</TD>
					<TD width="40" align="center"  
					    onclick="Explain('MeleeSkill')">
						<B>Melee Skill</B>
					</TD>
					<TD width="40" align="center"  
					    onclick="Explain('GunSkill')">
						<B>Gun Skill</B>
					</TD>
					<TD width="40" align="center"  
					    onclick="Explain('MedicSkill')">
						<B>Medic Skill</B>
					</TD>
				</TR>
				<TR>
					<TD width="40" align="center"  
					    onclick="ReportInfectedStatus()">
						<B><font size="5" color="green"><DIV id="HealthStatus">100</DIV></font></B>
					</TD>
					<TD width="40" align="center"  
					    onclick="ReportInfectedStatus()">
						<B><font size="5" color="red"><DIV id="InfectedStatus">0</DIV></font></B>
					</TD>
					<TD width="40" align="center"  
					    onclick="Explain('MeleeSkill')">
						<B><font size="5" color="blue"><DIV id="MeleeSkill">0</DIV></font></B>
					</TD>
					<TD width="40" align="center"  
					    onclick="Explain('GunSkill')">
						<B><font size="5" color="blue"><DIV id="GunSkill">0</DIV></font></B>
					</TD>
					<TD width="40" align="center"  
					    onclick="Explain('MedicSkill')">
						<B><font size="5" color="blue"><DIV id="MedicSkill">0</DIV></font></B>
					</TD>
				</TR>
				<TR>
					<TD colspan="5">
						<BR />
					</TD>
				</TR>				
				<TR>
					<TD width="50" align="center">
						<B>Zombies</B>
					</TD>
					<TD width="50" align="center">
						<B>Food</B>
					</TD>
					<TD width="50" align="center">
						<B>Ammo</B>
					</TD>
					<TD width="50" align="center">
						<B>Med Kits</B>
					</TD>
					<TD width="50" align="center">
						<B>Supplies</B>
					</TD>
				</TR>
				<TR>
					<TD width="50" align="center">
						<font size="5"><DIV id="ZombieCount">0</DIV></font>
					</TD>
					<TD width="50" align="center" 
					    onclick="UseFood()">
						<font size="5"><DIV id="FoodCount">0</DIV></font>
					</TD>
					<TD width="50" align="center" 
					    onclick="Reload()">
						<font size="5"><DIV id="AmmoCount">0</DIV></font>
					</TD>
					<TD width="50" align="center" 
					    onclick="UseMedkit()">
						<font size="5"><DIV id="MedKitCount">0</DIV></font>
					</TD>
					<TD width="50" align="center" 
					    onclick="UseSupplies()">
						<font size="5"><DIV id="SuppliesCount">0</DIV></font>
					</TD>
				</TR>
				<TR>
					<TD colspan="5">
						<HR />
					</TD>
				</TR>
					<TD width="50" align="center">
						<B>Gun</B>
					</TD>
					<TD width="50" align="center">
						<B>Special</B>
					</TD>
					<TD width="50" align="center">
						<B>Weapon</B>
					</TD>
					<TD width="50" align="center">
						<B>Armor</B>
					</TD>
					<TD width="50" align="center">
						<B><I>Future Use</I></B>
					</TD>
				</TR>
				
				<TR>
					<TD width="50" align="center" id="GunSlot" 
					    onclick="CheckItem('Gun')">
						<DIV value="ItemName:EmptySlot">
						<img src="EmptySlot.png"></img>
						</DIV>
					</TD>
					<TD width="50" align="center" id="SpecialSlot" 
					    onclick="CheckItem('Special Item')">
						<DIV value="ItemName:EmptySlot">
						<img src="EmptySlot.png"></img>
						</DIV>
					</TD>
					<TD width="50" align="center" id="WeaponSlot" 
					    onclick="CheckItem('Melee Weapon')">
						<DIV value="ItemName:EmptySlot">
						</DIV>
						<img src="EmptySlot.png"></img>
					</TD>
					<TD width="50" align="center" id="ArmorSlot" 
					    onclick="CheckItem('Protective Gear')">
						<DIV value="ItemName:EmptySlot">
						<img src="EmptySlot.png"></img>
						</DIV>
					</TD>
					<TD width="50" align="center">
						<DIV value="ItemName:EmptySlot">
						<img src="EmptySlot.png"></img>
					</TD>
				</TR>
				
				<TR>
					<TD colspan="5">
						<HR />
					</TD>
				</TR>
				<TR>
					<TD align="center" colspan="5">
						<B>Condition</B>
					</TD>
				</TR>
				<TR>
					<TD align="center" colspan="5" id="Condition">
					&nbsp;
					</TD>
				</TR>
				<TR>
					<TD colspan="5">
						<HR />
					</TD>
				</TR>
				<TR>
					<TD align="center" colspan="5">
						<B>Messages</B>
						<BR />
						<textarea rows="4" cols="60" id="MsgWindow"></textarea>
					</TD>
				</TR>
				<TR>
					<TD align="right" colspan="3">
						<input type="button" value="Clear Messages" 
						onclick="ClearMsgWindow()" />
					</TD>
					<TD align="left" colspan="2" id="MsgWindowStatus">
					
					</TD>
				</TR>                                
			</TABLE>

		</TD>
	</TR>
</TABLE>
<textarea rols="6" cols="40" id="DebugWindow"></textarea>
<SCRIPT>
	// FillCells();
	FillMap();
	PlaceZombies();
	PlaceItem(5,5,"crosshairs",1);
	// Examine("R5C5");
	CheckVisibility("R5C5");
	Message ("I know of some already, see if you can find them");
	Message ("Please report bugs to me at subbob@gmail.com");
	Message ("Learn by exploring, there are many undocumented features");
	Message ("Arrow keys to move, Left Click on icons for actions");
	Message ("Object of the Game: Survive! (Press F5 for New Map)");


	
</SCRIPT>
</BODY>
<SCRIPT>
var MsgWindows = document.getElementById("MsgWindow");
</SCRIPT>

</HTML>