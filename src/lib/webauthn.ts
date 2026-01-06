// WebAuthn utilities for biometric authentication

export const isWebAuthnSupported = (): boolean => {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
};

export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};

// Generate a random challenge
const generateChallenge = (): Uint8Array => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return array;
};

// Convert ArrayBuffer to Base64 string
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 string to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Register a new biometric credential
export const registerBiometric = async (): Promise<string | null> => {
  if (!await isBiometricAvailable()) return null;

  try {
    const challenge = generateChallenge();
    const userId = new Uint8Array([1, 2, 3, 4]);
    
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      rp: {
        name: '퀵플렉스 수입 관리',
        id: window.location.hostname,
      },
      user: {
        id: userId.buffer as ArrayBuffer,
        name: 'quickflex-user',
        displayName: '퀵플렉스 사용자',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) return null;

    return bufferToBase64(credential.rawId);
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return null;
  }
};

// Authenticate with biometric
export const authenticateBiometric = async (credentialId: string): Promise<boolean> => {
  if (!await isBiometricAvailable()) return false;

  try {
    const challenge = generateChallenge();
    
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      allowCredentials: [
        {
          id: base64ToBuffer(credentialId),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    return !!assertion;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
};
