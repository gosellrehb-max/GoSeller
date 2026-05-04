import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { UserDocument } from "../users/schemas/user.schema";
import { SellerService } from "../seller/seller.service";
import { EmailService } from "../email/email.service";
import { SELLER_TYPES } from "../seller/schemas/seller.schema";
import { ApiException } from "../../common/exceptions/api.exception";
import { VerificationService } from "../verification/verification.service";
import { CustomerService } from "../customer/customer.service";
import { RidersService } from "../riders/riders.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => SellerService))
    private sellerService: SellerService,
    private customerService: CustomerService,
    private emailService: EmailService,
    private verificationService: VerificationService,
    private ridersService: RidersService,
  ) {}

  private userRoles(user: UserDocument): string[] {
    const roles = (user as unknown as { roles?: string[] }).roles;
    if (Array.isArray(roles) && roles.length > 0) return roles;
    return user.role ? [user.role] : [];
  }

  private hasRole(user: UserDocument, role: string): boolean {
    return this.userRoles(user).includes(role);
  }

  private collectRoleLabels(u: UserDocument): string[] {
    const set = new Set<string>();
    if (u.role) set.add(u.role);
    const rs = (u as unknown as { roles?: string[] }).roles;
    if (Array.isArray(rs)) rs.forEach((r) => set.add(r));
    return [...set];
  }

  private formatRolesForRegistrationMessage(roles: string[]): string {
    const map: Record<string, string> = {
      customer: "a customer",
      seller: "a seller",
      rider: "a rider",
      admin: "an admin",
      "super-admin": "an administrator",
    };
    const parts = [...new Set(roles)].map((r) => map[r] ?? r);
    if (parts.length === 0) return "another account type";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  }

  private validateName(name: string, fieldName = "Name") {
    if (!/^[A-Za-z][A-Za-z\s'-]*$/.test((name ?? "").trim())) {
      throw ApiException.badRequest(`${fieldName} must contain letters only.`);
    }
  }

  private validatePassword(password: string) {
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password ?? "")) {
      throw ApiException.badRequest(
        "Password must be at least 8 characters and contain at least one uppercase letter and one number.",
      );
    }
  }

  async sendRegistrationCode(data: {
    email: string;
    role?: string;
    isSeller?: boolean;
  }) {
    const normalizedRole = data.isSeller
      ? "seller"
      : data.role === "user" || !data.role
        ? "customer"
        : data.role;
    if (!["customer", "seller", "rider"].includes(normalizedRole)) {
      throw ApiException.badRequest(
        "Verification code is only supported for customer, seller, or rider sign up.",
      );
    }

    const users = await this.usersService.findUsersByEmail(
      data.email.toLowerCase().trim(),
    );
    if (users.some((u) => this.hasRole(u as UserDocument, normalizedRole))) {
      throw ApiException.badRequest(
        `An account already exists for this email as ${normalizedRole}. Use a different email or log in with that role.`,
      );
    }

    const result = await this.verificationService.sendSignupCode(
      data.email,
      normalizedRole as "customer" | "seller" | "rider",
    );
    return {
      ...result,
      /** True when this email already has a user row without the role being registered — password must match. */
      existingAccountWithoutRole: users.length > 0,
    };
  }

  /** Before multi-step signup step 2 — whether the email can add this role (and if existing account, password will be required). */
  async checkRegistrationEmail(email: string, role: string) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) throw ApiException.badRequest("Email is required.");
    const normalizedRole = role === "user" ? "customer" : role;
    if (!["customer", "seller", "rider"].includes(normalizedRole)) {
      throw ApiException.badRequest("Invalid role.");
    }
    const users = await this.usersService.findUsersByEmail(normalizedEmail);
    const hasTargetRole = users.some((u) =>
      this.hasRole(u as UserDocument, normalizedRole),
    );
    const existingAccountWithoutRole = users.length > 0 && !hasTargetRole;
    const existingRoles =
      users.length === 1
        ? this.collectRoleLabels(users[0] as UserDocument)
        : [];
    const roleSummary = this.formatRolesForRegistrationMessage(existingRoles);
    const addLabel =
      normalizedRole === "customer"
        ? "customer"
        : normalizedRole === "rider"
          ? "rider"
          : normalizedRole;
    return {
      email: normalizedEmail,
      canRegister: !hasTargetRole,
      existingAccountWithoutRole,
      existingRoles,
      message: hasTargetRole
        ? `An account already exists for this email as ${normalizedRole}. Use a different email or log in with that role.`
        : existingAccountWithoutRole
          ? `This email is already registered as ${roleSummary}. We'll email a verification code — we'll add ${addLabel} access after you confirm.`
          : "Email is available.",
    };
  }

  async register(data: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    isSeller?: boolean;
    sellerType?: string;
    businessName?: string;
    verificationCode: string;
  }) {
    const isSeller =
      data.isSeller === true && data.sellerType && data.businessName?.trim();
    if (
      data.isSeller === true &&
      (!data.sellerType || !data.businessName?.trim())
    ) {
      throw ApiException.badRequest(
        "When registering as seller, sellerType and businessName are required.",
      );
    }
    if (
      data.sellerType &&
      !SELLER_TYPES.includes(data.sellerType as (typeof SELLER_TYPES)[number])
    ) {
      throw ApiException.badRequest(
        `sellerType must be one of: ${SELLER_TYPES.join(", ")}`,
      );
    }

    this.validateName(data.name, "Name");

    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0] || data.name;
    const lastName = nameParts.slice(1).join(" ") || "";

    const role = isSeller ? "seller" : data.role || "customer";
    const normalizedRole = role === "user" ? "customer" : role;
    const normalizedEmail = data.email.toLowerCase().trim();

    const sameEmailUsers =
      await this.usersService.findUsersByEmail(normalizedEmail);
    if (
      sameEmailUsers.some((u) =>
        this.hasRole(u as UserDocument, normalizedRole),
      )
    ) {
      throw ApiException.badRequest(
        `An account already exists for this email as ${normalizedRole}. Use a different email or log in with that role.`,
      );
    }

    const isNewAccount = sameEmailUsers.length === 0;
    if (isNewAccount) {
      if (!(data.password ?? "").trim()) {
        throw ApiException.badRequest("Password is required.");
      }
      this.validatePassword(data.password!);
    }

    await this.verificationService.consumeSignupCode(
      data.email,
      normalizedRole as "customer" | "seller" | "rider",
      data.verificationCode,
    );

    const requireApproval =
      this.configService.get<boolean>("auth.requireAdminApproval") ?? true;
    const needsApproval =
      requireApproval &&
      (normalizedRole === "customer" ||
        normalizedRole === "seller" ||
        normalizedRole === "rider" ||
        role === "user");
    const status = needsApproval ? "pending" : "active";

    let user: UserDocument;
    if (sameEmailUsers.length === 0) {
      const hashedPassword = await bcrypt.hash(data.password!, 10);
      user = await this.usersService.create({
        firstName,
        lastName,
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedRole,
        roles: [normalizedRole],
        status,
        authSource: "local",
      });
    } else if (sameEmailUsers.length === 1) {
      const existingId = (
        sameEmailUsers[0] as unknown as { _id: { toString(): string } }
      )._id.toString();
      const existingUser = await this.usersService.findById(existingId, true);
      if (!existingUser) throw ApiException.notFound("User not found.");
      user = await this.usersService.addRole(existingId, normalizedRole);
    } else {
      // Safe fallback for legacy duplicated identities: avoid attaching a new role to an ambiguous account.
      throw ApiException.conflict(
        "Multiple legacy accounts exist with this email. Contact support/admin to merge accounts before adding a new role.",
      );
    }

    if (isSeller) {
      const userId = (user as { _id: { toString(): string } })._id.toString();
      const seller = await this.sellerService.create({
        userId,
        email: normalizedEmail,
        businessName: data.businessName!.trim(),
        type: data.sellerType!,
        status,
      });
    } else if (normalizedRole === "customer") {
      const userId = (user as { _id: { toString(): string } })._id.toString();
      await this.customerService.ensureProfile(userId, {
        phone: (user as { phone?: string }).phone,
      });
    }

    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") || data.email;
    const welcomeRole: "customer" | "seller" | "rider" = isSeller
      ? "seller"
      : normalizedRole === "rider"
        ? "rider"
        : "customer";
    this.emailService
      .sendWelcomeEmail(data.email, displayName, welcomeRole)
      .catch(() => {});

    const token = this.jwtService.sign({
      id: (user as { _id: { toString(): string } })._id.toString(),
      email: user.email,
      role: normalizedRole,
      roles: this.userRoles(user),
      authSource: "local",
      externalId: (user as { externalId?: string }).externalId ?? undefined,
    });

    return {
      user: {
        id: (user as unknown as { _id: unknown })._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: normalizedRole,
        roles: this.userRoles(user),
        status: user.status,
        authSource: user.authSource ?? "local",
        pendingApproval: user.status === "pending",
      },
      token,
      message:
        status === "pending"
          ? "Registration successful. Your account is pending admin approval. You can log in after an admin approves your account."
          : undefined,
    };
  }

  async login(email: string, password: string, accountRole?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const allUsersWithEmail =
      await this.usersService.findUsersByEmail(normalizedEmail);
    let candidates: UserDocument[];

    if (accountRole) {
      const role = accountRole === "user" ? "customer" : accountRole;
      candidates = allUsersWithEmail.filter((u) =>
        this.hasRole(u as UserDocument, role),
      );
    } else {
      candidates = allUsersWithEmail;
    }

    if (candidates.length === 0) {
      if (accountRole) {
        const role = accountRole === "user" ? "customer" : accountRole;
        if (allUsersWithEmail.length > 0) {
          if (role === "seller") {
            throw ApiException.notFound(
              "No seller access on this account yet. Complete seller registration with this email and your account password, then sign in here.",
            );
          }
          if (role === "customer") {
            throw ApiException.notFound(
              "No customer access on this account yet. Complete customer sign-up with this email and your account password, then sign in here.",
            );
          }
          if (role === "rider") {
            throw ApiException.notFound(
              "No rider access on this account yet. Complete rider registration with this email and your account password, then sign in here.",
            );
          }
        }
        throw ApiException.notFound(
          `No account found for this email as a ${role}. Check the email or use the correct login page.`,
        );
      }
      throw ApiException.notFound(
        "No account found with this email. Sign up if you are new.",
      );
    }

    const matching: UserDocument[] = [];
    for (const u of candidates) {
      const id = (
        u as unknown as { _id: { toString(): string } }
      )._id.toString();
      const fullUser = await this.usersService.findById(id, true);
      if (!fullUser) continue;
      const isPasswordValid = await bcrypt.compare(password, fullUser.password);
      if (isPasswordValid) matching.push(fullUser);
    }

    if (matching.length === 0) {
      throw ApiException.unauthorized(
        "Incorrect password. Try again or use forgot password when available.",
      );
    }
    if (matching.length > 1) {
      throw ApiException.badRequest(
        "Multiple accounts use this email. Log in from the customer, seller, or rider login page.",
      );
    }

    const fullUser = matching[0];

    // Only active accounts can log in; pending = awaiting approval, inactive/suspended = disabled by admin
    if (fullUser.status !== "active") {
      if (fullUser.status === "pending") {
        throw ApiException.forbidden(
          "Your account is pending admin approval. You will be able to log in once approved.",
        );
      }
      throw ApiException.forbidden(
        "Your account has been disabled. Please contact admin.",
      );
    }

    const authSource =
      (fullUser as { authSource?: string }).authSource ?? "local";
    const externalId = (fullUser as { externalId?: string }).externalId;
    const selectedRole = accountRole === "user" ? "customer" : accountRole;
    const activeRole =
      selectedRole && this.hasRole(fullUser, selectedRole)
        ? selectedRole
        : (this.userRoles(fullUser)[0] ?? fullUser.role);

    const token = this.jwtService.sign({
      id: (fullUser as { _id: { toString(): string } })._id.toString(),
      email: fullUser.email,
      role: activeRole,
      roles: this.userRoles(fullUser),
      authSource,
      externalId: externalId ?? undefined,
    });

    return {
      user: {
        id: (fullUser as unknown as { _id: unknown })._id,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        name: `${fullUser.firstName} ${fullUser.lastName}`.trim(),
        email: fullUser.email,
        role: activeRole,
        roles: this.userRoles(fullUser),
        authSource,
      },
      token,
    };
  }

  /** Sends a password reset code if a local (email/password) account exists for the email. */
  async sendForgotPasswordCode(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) throw ApiException.badRequest("Email is required.");
    const users = await this.usersService.findUsersByEmail(normalizedEmail);
    const localUser = users.find(
      (u) => ((u as { authSource?: string }).authSource ?? "local") === "local",
    );
    if (!localUser) {
      return {
        email: normalizedEmail,
        sent: false,
        message:
          "If an account exists for this email, we sent a password reset code.",
      };
    }
    return this.verificationService.sendPasswordResetCode(normalizedEmail);
  }

  /** Consumes the reset code and sets a new password for local-auth users with this email. */
  async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) throw ApiException.badRequest("Email is required.");
    this.validatePassword(newPassword);

    const users = await this.usersService.findUsersByEmail(normalizedEmail);
    const localUsers = users.filter(
      (u) => ((u as { authSource?: string }).authSource ?? "local") === "local",
    );
    if (localUsers.length === 0) {
      throw ApiException.badRequest(
        "No password-based account found for this email.",
      );
    }

    await this.verificationService.consumePasswordResetCode(
      normalizedEmail,
      code,
    );
    const hashed = await bcrypt.hash(newPassword, 10);
    const modified = await this.usersService.updatePasswordForEmail(
      normalizedEmail,
      hashed,
    );
    if (modified === 0) {
      throw ApiException.badRequest(
        "Could not update password. Try again or contact support.",
      );
    }
    return {
      message: "Password updated. You can sign in with your new password.",
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId, true);
    if (!user) throw ApiException.notFound("User not found");
    const authSource = (user as unknown as { authSource?: string }).authSource ?? "local";
    if (authSource !== "local") {
      throw ApiException.badRequest("Password cannot be changed for social/IdP accounts.");
    }
    const storedHash = (user as unknown as { password?: string }).password;
    if (!storedHash) {
      throw ApiException.badRequest("No password set for this account.");
    }
    const match = await bcrypt.compare(currentPassword, storedHash);
    if (!match) throw ApiException.badRequest("Current password is incorrect.");
    if (newPassword.length < 8) {
      throw ApiException.badRequest("New password must be at least 8 characters.");
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePasswordById(userId, hashed);
    return { message: "Password changed successfully." };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw ApiException.notFound("User not found");
    const obj = user.toObject();
    delete (obj as Record<string, unknown>).password;
    return { user: obj };
  }

  /**
   * Re-issue a JWT for an already-authenticated user with a different role they already own.
   * Does NOT require password. Used by the UI to switch between customer / seller / rider sessions.
   */
  async switchRole(userId: string, targetRole: string) {
    const normalized = targetRole === "user" ? "customer" : targetRole;
    if (!["customer", "seller", "rider"].includes(normalized)) {
      throw ApiException.badRequest(
        "Invalid role. Allowed: customer, seller, rider.",
      );
    }

    let user = await this.usersService.findById(userId, true);
    if (!user) throw ApiException.notFound("User not found.");

    if (user.status !== "active") {
      throw ApiException.forbidden("Your account is not active.");
    }

    if (!this.hasRole(user, normalized)) {
      // Seamless seller activation for authenticated customer sessions:
      // add seller role + create a baseline seller profile if missing.
      if (normalized === "seller") {
        user = await this.usersService.addRole(userId, "seller");
        const existingSeller = await this.sellerService.findByUserId(userId);
        if (!existingSeller) {
          const first = (user.firstName ?? "").trim();
          const last = (user.lastName ?? "").trim();
          const fallbackName =
            [first, last].filter(Boolean).join(" ").trim() ||
            user.email.split("@")[0] ||
            "Seller";
          await this.sellerService.create({
            userId,
            email: user.email,
            businessName: `${fallbackName}'s Store`,
            type: "Shopkeeper",
            status: "active",
          });
        }
      } else if (normalized === "rider") {
        user = await this.usersService.addRole(userId, "rider");
        await this.ridersService.ensureDraftProfileForUser(userId, {
          phone: (user as { phone?: string }).phone,
        });
      } else {
        throw ApiException.forbidden(
          `This account does not have ${normalized} access. Complete ${normalized} onboarding first.`,
        );
      }
    }

    const authSource = (user as { authSource?: string }).authSource ?? "local";
    const externalId = (user as { externalId?: string }).externalId;

    const token = this.jwtService.sign({
      id: (user as { _id: { toString(): string } })._id.toString(),
      email: user.email,
      role: normalized,
      roles: this.userRoles(user),
      authSource,
      externalId: externalId ?? undefined,
    });

    return {
      user: {
        id: (user as unknown as { _id: unknown })._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: normalized,
        roles: this.userRoles(user),
        authSource,
      },
      token,
    };
  }
}
